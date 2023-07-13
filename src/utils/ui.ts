/**
 * Utils to do UI stuff such as opening dialogs, toasts, etc.
 * Basically anything that may directly or indirectly import a Vue file.
 */
import { t } from 'fyo';
import type { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { getActions } from 'fyo/utils';
import {
  BaseError,
  getDbError,
  LinkValidationError,
  ValueError,
} from 'fyo/utils/errors';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { PurchaseInvoice } from 'models/baseModels/PurchaseInvoice/PurchaseInvoice';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { getLedgerLink } from 'models/helpers';
import { Transfer } from 'models/inventory/Transfer';
import { Transactional } from 'models/Transactional/Transactional';
import { ModelNameEnum } from 'models/types';
import { Schema } from 'schemas/types';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import router from 'src/router';
import { assertIsType } from 'utils/index';
import { SelectFileOptions } from 'utils/types';
import { RouteLocationRaw } from 'vue-router';
import { evaluateHidden } from './doc';
import { showDialog, showToast } from './interactive';
import { showSidebar } from './refs';
import {
  ActionGroup,
  QuickEditOptions,
  SettingsTab,
  ToastOptions,
  UIGroupedFields,
} from './types';

export const toastDurationMap = { short: 2_500, long: 5_000 } as const;

export async function openQuickEdit({
  doc,
  hideFields = [],
  showFields = [],
}: QuickEditOptions) {
  const { schemaName, name } = doc;
  if (!name) {
    throw new ValueError(t`Quick edit error: ${schemaName} entry has no name.`);
  }

  if (router.currentRoute.value.query.name === name) {
    return;
  }

  const query = {
    edit: 1,
    name,
    schemaName,
    showFields,
    hideFields,
  };
  await router.push({ query });
}

export async function openSettings(tab: SettingsTab) {
  await routeTo({ path: '/settings', query: { tab } });
}

export async function routeTo(route: RouteLocationRaw) {
  if (
    typeof route === 'string' &&
    route === router.currentRoute.value.fullPath
  ) {
    return;
  }

  return await router.push(route);
}

export async function deleteDocWithPrompt(doc: Doc) {
  const schemaLabel = fyo.schemaMap[doc.schemaName]!.label;
  let detail = t`This action is permanent.`;
  if (doc.isTransactional && doc.isSubmitted) {
    detail = t`This action is permanent and will delete associated ledger entries.`;
  }

  return (await showDialog({
    title: t`Delete ${getDocReferenceLabel(doc)}?`,
    detail,
    type: 'warning',
    buttons: [
      {
        label: t`Yes`,
        async action() {
          try {
            await doc.delete();
          } catch (err) {
            if (getDbError(err as Error) === LinkValidationError) {
              await showDialog({
                title: t`Delete Failed`,
                detail: t`Cannot delete ${schemaLabel} "${doc.name!}" because of linked entries.`,
                type: 'error',
              });
            } else {
              await handleErrorWithDialog(err as Error, doc);
            }

            return false;
          }

          return true;
        },
        isPrimary: true,
      },
      {
        label: t`No`,
        action() {
          return false;
        },
        isEscape: true,
      },
    ],
  })) as boolean;
}

export async function cancelDocWithPrompt(doc: Doc) {
  let detail = t`This action is permanent`;
  if (['SalesInvoice', 'PurchaseInvoice'].includes(doc.schemaName)) {
    const payments = (
      await fyo.db.getAll('Payment', {
        fields: ['name'],
        filters: { cancelled: false },
      })
    ).map(({ name }) => name);

    const query = (
      await fyo.db.getAll('PaymentFor', {
        fields: ['parent'],
        filters: {
          referenceName: doc.name!,
        },
      })
    ).filter(({ parent }) => payments.includes(parent));

    const paymentList = [...new Set(query.map(({ parent }) => parent))];

    if (paymentList.length === 1) {
      detail = t`This action is permanent and will cancel the following payment: ${
        paymentList[0] as string
      }`;
    } else if (paymentList.length > 1) {
      detail = t`This action is permanent and will cancel the following payments: ${paymentList.join(
        ', '
      )}`;
    }
  }

  return (await showDialog({
    title: t`Cancel ${getDocReferenceLabel(doc)}?`,
    detail,
    type: 'warning',
    buttons: [
      {
        label: t`Yes`,
        async action() {
          try {
            await doc.cancel();
          } catch (err) {
            await handleErrorWithDialog(err as Error, doc);
            return false;
          }

          return true;
        },
        isPrimary: true,
      },
      {
        label: t`No`,
        action() {
          return false;
        },
        isEscape: true,
      },
    ],
  })) as boolean;
}

export function getActionsForDoc(doc?: Doc): Action[] {
  if (!doc) return [];

  const actions: Action[] = [
    ...getActions(doc),
    getDuplicateAction(doc),
    getDeleteAction(doc),
    getCancelAction(doc),
  ];

  return actions
    .filter((d) => d.condition?.(doc) ?? true)
    .map((d) => {
      return {
        group: d.group,
        label: d.label,
        component: d.component,
        action: d.action,
      };
    });
}

export function getGroupedActionsForDoc(doc?: Doc): ActionGroup[] {
  const actions = getActionsForDoc(doc);
  const actionsMap = actions.reduce((acc, ac) => {
    if (!ac.group) {
      ac.group = '';
    }

    acc[ac.group] ??= {
      group: ac.group,
      label: ac.label ?? '',
      type: ac.type ?? 'secondary',
      actions: [],
    };

    acc[ac.group].actions.push(ac);
    return acc;
  }, {} as Record<string, ActionGroup>);

  const grouped = Object.keys(actionsMap)
    .filter(Boolean)
    .sort()
    .map((k) => actionsMap[k]);

  return [grouped, actionsMap['']].flat().filter(Boolean);
}

function getCancelAction(doc: Doc): Action {
  return {
    label: t`Cancel`,
    component: {
      template: '<span class="text-red-700">{{ t`Cancel` }}</span>',
    },
    condition: (doc: Doc) => doc.canCancel,
    async action() {
      await commonDocCancel(doc);
    },
  };
}

function getDeleteAction(doc: Doc): Action {
  return {
    label: t`Delete`,
    component: {
      template: '<span class="text-red-700">{{ t`Delete` }}</span>',
    },
    condition: (doc: Doc) => doc.canDelete,
    async action() {
      await commongDocDelete(doc);
    },
  };
}

async function openEdit({ name, schemaName }: Doc) {
  if (!name) {
    return;
  }

  const route = getFormRoute(schemaName, name);
  return await routeTo(route);
}

function getDuplicateAction(doc: Doc): Action {
  const isSubmittable = !!doc.schema.isSubmittable;
  return {
    label: t`Duplicate`,
    group: t`Create`,
    condition: (doc: Doc) =>
      !!(
        ((isSubmittable && doc.submitted) || !isSubmittable) &&
        !doc.notInserted
      ),
    async action() {
      try {
        const dupe = doc.duplicate();
        await openEdit(dupe);
      } catch (err) {
        await handleErrorWithDialog(err as Error, doc);
      }
    },
  };
}

export function getFieldsGroupedByTabAndSection(
  schema: Schema,
  doc: Doc
): UIGroupedFields {
  const grouped: UIGroupedFields = new Map();
  for (const field of schema?.fields ?? []) {
    const tab = field.tab ?? 'Main';
    const section = field.section ?? 'Default';
    if (!grouped.has(tab)) {
      grouped.set(tab, new Map());
    }

    const tabbed = grouped.get(tab)!;
    if (!tabbed.has(section)) {
      tabbed.set(section, []);
    }

    if (field.meta) {
      continue;
    }

    if (evaluateHidden(field, doc)) {
      continue;
    }

    tabbed.get(section)!.push(field);
  }

  // Delete empty tabs and sections
  for (const tkey of grouped.keys()) {
    const section = grouped.get(tkey);
    if (!section) {
      grouped.delete(tkey);
      continue;
    }

    for (const skey of section.keys()) {
      const fields = section.get(skey);
      if (!fields || !fields.length) {
        section.delete(skey);
      }
    }

    if (!section?.size) {
      grouped.delete(tkey);
    }
  }

  return grouped;
}

export function getFormRoute(
  schemaName: string,
  name: string
): RouteLocationRaw {
  const route = fyo.models[schemaName]
    ?.getListViewSettings(fyo)
    ?.formRoute?.(name);

  if (typeof route === 'string') {
    return route;
  }

  // Use `encodeURIComponent` if more name issues
  return `/edit/${schemaName}/${name.replaceAll('/', '%2F')}`;
}

export async function getDocFromNameIfExistsElseNew(
  schemaName: string,
  name?: string
) {
  if (!name) {
    return fyo.doc.getNewDoc(schemaName);
  }

  try {
    return await fyo.doc.getDoc(schemaName, name);
  } catch {
    return fyo.doc.getNewDoc(schemaName);
  }
}

export async function isPrintable(schemaName: string) {
  const numTemplates = await fyo.db.count(ModelNameEnum.PrintTemplate, {
    filters: { type: schemaName },
  });
  return numTemplates > 0;
}

export function toggleSidebar(value?: boolean) {
  if (typeof value !== 'boolean') {
    value = !showSidebar.value;
  }

  showSidebar.value = value;
}

export function focusOrSelectFormControl(
  doc: Doc,
  ref: unknown,
  shouldClear = true
) {
  if (!doc?.fyo) {
    return;
  }

  const naming = doc.fyo.schemaMap[doc.schemaName]?.naming;
  if (naming !== 'manual' || doc.inserted) {
    return;
  }

  if (!doc.fyo.doc.isTemporaryName(doc.name ?? '', doc.schema)) {
    return;
  }

  if (Array.isArray(ref) && ref.length > 0) {
    ref = ref[0];
  }

  if (
    !ref ||
    typeof ref !== 'object' ||
    !assertIsType<Record<string, () => void>>(ref)
  ) {
    return;
  }

  if (!shouldClear && typeof ref?.select === 'function') {
    ref.select();
    return;
  }

  if (typeof ref?.clear === 'function') {
    ref.clear();
  }

  if (typeof ref?.focus === 'function') {
    ref.focus();
  }

  doc.name = '';
}

export async function selectTextFile(filters?: SelectFileOptions['filters']) {
  const options = {
    title: t`Select File`,
    filters,
  };
  const { success, canceled, filePath, data, name } = await ipc.selectFile(
    options
  );

  if (canceled || !success) {
    showToast({
      type: 'error',
      message: t`File selection failed`,
    });
    return {};
  }

  const text = new TextDecoder().decode(data);
  if (!text) {
    showToast({
      type: 'error',
      message: t`Empty file selected`,
    });

    return {};
  }

  return { text, filePath, name };
}

export enum ShortcutKey {
  enter = 'enter',
  ctrl = 'ctrl',
  pmod = 'pmod',
  shift = 'shift',
  alt = 'alt',
  delete = 'delete',
  esc = 'esc',
}

export function getShortcutKeyMap(
  platform: string
): Record<ShortcutKey, string> {
  if (platform === 'Mac') {
    return {
      [ShortcutKey.alt]: '⌥',
      [ShortcutKey.ctrl]: '⌃',
      [ShortcutKey.pmod]: '⌘',
      [ShortcutKey.shift]: 'shift',
      [ShortcutKey.delete]: 'delete',
      [ShortcutKey.esc]: 'esc',
      [ShortcutKey.enter]: 'return',
    };
  }
  return {
    [ShortcutKey.alt]: 'Alt',
    [ShortcutKey.ctrl]: 'Ctrl',
    [ShortcutKey.pmod]: 'Ctrl',
    [ShortcutKey.shift]: '⇧',
    [ShortcutKey.delete]: 'Backspace',
    [ShortcutKey.esc]: 'Esc',
    [ShortcutKey.enter]: 'Enter',
  };
}

export async function commongDocDelete(doc: Doc): Promise<boolean> {
  const res = await deleteDocWithPrompt(doc);
  if (!res) {
    return false;
  }

  showActionToast(doc, 'delete');
  router.back();
  return true;
}

export async function commonDocCancel(doc: Doc): Promise<boolean> {
  const res = await cancelDocWithPrompt(doc);
  if (!res) {
    return false;
  }

  showActionToast(doc, 'cancel');
  return true;
}

export async function commonDocSync(
  doc: Doc,
  useDialog = false
): Promise<boolean> {
  let success: boolean;
  if (useDialog) {
    success = !!(await showSubmitOrSyncDialog(doc, 'sync'));
  } else {
    success = await syncWithoutDialog(doc);
  }

  if (!success) {
    return false;
  }

  showActionToast(doc, 'sync');
  return true;
}

async function syncWithoutDialog(doc: Doc): Promise<boolean> {
  try {
    await doc.sync();
  } catch (error) {
    await handleErrorWithDialog(error, doc);
    return false;
  }

  return true;
}

export async function commonDocSubmit(doc: Doc): Promise<boolean> {
  let success = true;
  if (
    doc instanceof SalesInvoice &&
    fyo.singles.AccountingSettings?.enableInventory
  ) {
    success = await showInsufficientInventoryDialog(doc);
  }

  if (!success) {
    return false;
  }

  success = await showSubmitOrSyncDialog(doc, 'submit');
  if (!success) {
    return false;
  }

  showSubmitToast(doc);
  return true;
}

async function showInsufficientInventoryDialog(doc: SalesInvoice) {
  const insufficient: { item: string; quantity: number }[] = [];
  for (const { item, quantity, batch } of doc.items ?? []) {
    if (!item || typeof quantity !== 'number') {
      continue;
    }

    const isTracked = await fyo.getValue(ModelNameEnum.Item, item, 'trackItem');
    if (!isTracked) {
      continue;
    }

    const stockQuantity =
      (await fyo.db.getStockQuantity(
        item,
        undefined,
        undefined,
        doc.date!.toISOString(),
        batch
      )) ?? 0;

    if (stockQuantity > quantity) {
      continue;
    }

    insufficient.push({ item, quantity: quantity - stockQuantity });
  }

  if (insufficient.length) {
    const buttons = [
      {
        label: t`Yes`,
        action: () => true,
        isPrimary: true,
      },
      {
        label: t`No`,
        action: () => false,
        isEscape: true,
      },
    ];

    const list = insufficient
      .map(({ item, quantity }) => `${item} (${quantity})`)
      .join(', ');
    const detail = [
      t`The following items have insufficient quantity for Shipment: ${list}`,
      t`Continue submitting Sales Invoice?`,
    ];

    return (await showDialog({
      title: t`Insufficient Quantity`,
      type: 'warning',
      detail,
      buttons,
    })) as boolean;
  }

  return true;
}

async function showSubmitOrSyncDialog(doc: Doc, type: 'submit' | 'sync') {
  const label = getDocReferenceLabel(doc);
  let title = t`Save ${label}?`;
  if (type === 'submit') {
    title = t`Submit ${label}?`;
  }

  let detail: string;
  if (type === 'submit') {
    detail = getDocSubmitMessage(doc);
  } else {
    detail = getDocSyncMessage(doc);
  }

  const yesAction = async () => {
    try {
      await doc[type]();
    } catch (error) {
      await handleErrorWithDialog(error, doc);
      return false;
    }

    return true;
  };

  const buttons = [
    {
      label: t`Yes`,
      action: yesAction,
      isPrimary: true,
    },
    {
      label: t`No`,
      action: () => false,
      isEscape: true,
    },
  ];

  const dialogOptions = {
    title,
    detail,
    buttons,
  };

  return (await showDialog(dialogOptions)) as boolean;
}

function getDocSyncMessage(doc: Doc): string {
  const label = getDocReferenceLabel(doc);
  const detail = t`Create new ${doc.schema.label} entry?`;
  if (doc.inserted) {
    return t`Save changes made to ${label}?`;
  }

  if (doc instanceof Invoice && doc.grandTotal?.isZero()) {
    const gt = doc.fyo.format(doc.grandTotal ?? doc.fyo.pesa(0), 'Currency');
    return [
      detail,
      t`Entry has Grand Total ${gt}. Please verify amounts.`,
    ].join(' ');
  }

  return detail;
}

function getDocSubmitMessage(doc: Doc): string {
  const details = [t`Mark ${doc.schema.label} as submitted?`];

  if (doc instanceof SalesInvoice && doc.makeAutoPayment) {
    const toAccount = doc.autoPaymentAccount!;
    const fromAccount = doc.account!;
    const amount = fyo.format(doc.outstandingAmount, 'Currency');

    details.push(
      t`Payment of ${amount} will be made from account "${fromAccount}" to account "${toAccount}" on Submit.`
    );
  } else if (doc instanceof PurchaseInvoice && doc.makeAutoPayment) {
    const fromAccount = doc.autoPaymentAccount!;
    const toAccount = doc.account!;
    const amount = fyo.format(doc.outstandingAmount, 'Currency');

    details.push(
      t`Payment of ${amount} will be made from account "${fromAccount}" to account "${toAccount}" on Submit.`
    );
  }

  return details.join(' ');
}

function showActionToast(doc: Doc, type: 'sync' | 'cancel' | 'delete') {
  const label = getDocReferenceLabel(doc);
  const message = {
    sync: t`${label} saved`,
    cancel: t`${label} cancelled`,
    delete: t`${label} deleted`,
  }[type];

  showToast({ type: 'success', message, duration: 'short' });
}

function showSubmitToast(doc: Doc) {
  const label = getDocReferenceLabel(doc);
  const message = t`${label} submitted`;
  const toastOption: ToastOptions = {
    type: 'success',
    message,
    duration: 'long',
    ...getSubmitSuccessToastAction(doc),
  };
  showToast(toastOption);
}

function getSubmitSuccessToastAction(doc: Doc) {
  const isStockTransfer = doc instanceof Transfer;
  const isTransactional = doc instanceof Transactional;

  if (isStockTransfer) {
    return {
      async action() {
        const route = getLedgerLink(doc, 'StockLedger');
        await routeTo(route);
      },
      actionText: t`View Stock Entries`,
    };
  }

  if (isTransactional) {
    return {
      async action() {
        const route = getLedgerLink(doc, 'GeneralLedger');
        await routeTo(route);
      },
      actionText: t`View Accounting Entries`,
    };
  }

  return {};
}

export function showCannotSaveOrSubmitToast(doc: Doc) {
  const label = getDocReferenceLabel(doc);
  let message = t`${label} already saved`;

  if (doc.schema.isSubmittable && doc.isSubmitted) {
    message = t`${label} already submitted`;
  }

  showToast({ type: 'warning', message, duration: 'short' });
}

export function showCannotCancelOrDeleteToast(doc: Doc) {
  const label = getDocReferenceLabel(doc);
  let message = t`${label} cannot be deleted`;
  if (doc.schema.isSubmittable && !doc.isCancelled) {
    message = t`${label} cannot be cancelled`;
  }

  showToast({ type: 'warning', message, duration: 'short' });
}

function getDocReferenceLabel(doc: Doc) {
  const label = doc.schema.label || doc.schemaName;
  if (doc.schema.naming === 'random') {
    return label;
  }

  return doc.name || label;
}

export const printSizes = [
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'B0',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'Letter',
  'Legal',
  'Executive',
  'C5E',
  'Comm10',
  'DLE',
  'Folio',
  'Ledger',
  'Tabloid',
  'Custom',
] as const;

export const paperSizeMap: Record<
  typeof printSizes[number],
  { width: number; height: number }
> = {
  A0: {
    width: 84.1,
    height: 118.9,
  },
  A1: {
    width: 59.4,
    height: 84.1,
  },
  A2: {
    width: 42,
    height: 59.4,
  },
  A3: {
    width: 29.7,
    height: 42,
  },
  A4: {
    width: 21,
    height: 29.7,
  },
  A5: {
    width: 14.8,
    height: 21,
  },
  A6: {
    width: 10.5,
    height: 14.8,
  },
  A7: {
    width: 7.4,
    height: 10.5,
  },
  A8: {
    width: 5.2,
    height: 7.4,
  },
  A9: {
    width: 3.7,
    height: 5.2,
  },
  B0: {
    width: 100,
    height: 141.4,
  },
  B1: {
    width: 70.7,
    height: 100,
  },
  B2: {
    width: 50,
    height: 70.7,
  },
  B3: {
    width: 35.3,
    height: 50,
  },
  B4: {
    width: 25,
    height: 35.3,
  },
  B5: {
    width: 17.6,
    height: 25,
  },
  B6: {
    width: 12.5,
    height: 17.6,
  },
  B7: {
    width: 8.8,
    height: 12.5,
  },
  B8: {
    width: 6.2,
    height: 8.8,
  },
  B9: {
    width: 4.4,
    height: 6.2,
  },
  Letter: {
    width: 21.59,
    height: 27.94,
  },
  Legal: {
    width: 21.59,
    height: 35.56,
  },
  Executive: {
    width: 19.05,
    height: 25.4,
  },
  C5E: {
    width: 16.3,
    height: 22.9,
  },
  Comm10: {
    width: 10.5,
    height: 24.1,
  },
  DLE: {
    width: 11,
    height: 22,
  },
  Folio: {
    width: 21,
    height: 33,
  },
  Ledger: {
    width: 43.2,
    height: 27.9,
  },
  Tabloid: {
    width: 27.9,
    height: 43.2,
  },
  Custom: {
    width: -1,
    height: -1,
  },
};

export function showExportInFolder(message: string, filePath: string) {
  showToast({
    message,
    actionText: t`Open Folder`,
    type: 'success',
    action: () => {
      ipc.showItemInFolder(filePath);
    },
  });
}

export async function deleteDb(filePath: string) {
  const { error } = await ipc.deleteFile(filePath);

  if (error?.code === 'EBUSY') {
    await showDialog({
      title: t`Delete Failed`,
      detail: t`Please restart and try again.`,
      type: 'error',
    });
  } else if (error?.code === 'ENOENT') {
    await showDialog({
      title: t`Delete Failed`,
      detail: t`File ${filePath} does not exist.`,
      type: 'error',
    });
  } else if (error?.code === 'EPERM') {
    await showDialog({
      title: t`Cannot Delete`,
      detail: t`Close Frappe Books and try manually.`,
      type: 'error',
    });
  } else if (error) {
    const err = new BaseError(500, error.message);
    err.name = error.name;
    err.stack = error.stack;
    throw err;
  }
}

export async function getSelectedFilePath() {
  return ipc.getOpenFilePath({
    title: t`Select file`,
    properties: ['openFile'],
    filters: [{ name: 'SQLite DB File', extensions: ['db'] }],
  });
}

export async function getSavePath(name: string, extention: string) {
  const response = await ipc.getSaveFilePath({
    title: t`Select folder`,
    defaultPath: `${name}.${extention}`,
  });

  const canceled = response.canceled;
  let filePath = response.filePath;

  if (filePath && !filePath.endsWith(extention) && filePath !== ':memory:') {
    filePath = `${filePath}.${extention}`;
  }

  return { canceled, filePath };
}
