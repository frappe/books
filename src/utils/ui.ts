/**
 * Utils to do UI stuff such as opening dialogs, toasts, etc.
 * Basically anything that may directly or indirectly import a Vue file.
 */
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import type { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { getActions } from 'fyo/utils';
import { getDbError, LinkValidationError, ValueError } from 'fyo/utils/errors';
import { getLedgerLink } from 'models/helpers';
import { Transfer } from 'models/inventory/Transfer';
import { Transactional } from 'models/Transactional/Transactional';
import { ModelNameEnum } from 'models/types';
import { Schema } from 'schemas/types';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import router from 'src/router';
import { IPC_ACTIONS } from 'utils/messages';
import { SelectFileOptions } from 'utils/types';
import { App, createApp, h } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { stringifyCircular } from './';
import { evaluateHidden } from './doc';
import { selectFile } from './ipcCalls';
import { showSidebar } from './refs';
import {
  ActionGroup,
  MessageDialogOptions,
  QuickEditOptions,
  SettingsTab,
  ToastOptions,
  UIGroupedFields,
} from './types';

export async function openQuickEdit({
  doc,
  schemaName,
  name,
  hideFields = [],
  showFields = [],
  defaults = {},
  listFilters = {},
}: QuickEditOptions) {
  if (doc) {
    schemaName = doc.schemaName;
    name = doc.name;
  }

  if (!doc && (!schemaName || !name)) {
    throw new ValueError(t`Schema Name or Name not passed to Open Quick Edit`);
  }

  const currentRoute = router.currentRoute.value;
  const query = currentRoute.query;
  let method: 'push' | 'replace' = 'push';

  if (query.edit && query.schemaName === schemaName) {
    method = 'replace';
  }

  if (query.name === name) {
    return;
  }

  const forWhat = (defaults?.for ?? []) as string[];
  if (forWhat[0] === 'not in') {
    const purpose = forWhat[1]?.[0];

    defaults = Object.assign({
      for:
        purpose === 'Sales'
          ? 'Purchases'
          : purpose === 'Purchases'
          ? 'Sales'
          : 'Both',
    });
  }

  if (forWhat[0] === 'not in' && forWhat[1] === 'Sales') {
    defaults = Object.assign({ for: 'Purchases' });
  }

  router[method]({
    query: {
      edit: 1,
      schemaName,
      name,
      showFields,
      hideFields,
      defaults: stringifyCircular(defaults),
      filters: JSON.stringify(listFilters),
    },
  });
}

// @ts-ignore
window.openqe = openQuickEdit;

export async function showMessageDialog({
  message,
  detail,
  buttons = [],
}: MessageDialogOptions) {
  const options = {
    message,
    detail,
    buttons: buttons.map((a) => a.label),
  };

  const { response } = (await ipcRenderer.invoke(
    IPC_ACTIONS.GET_DIALOG_RESPONSE,
    options
  )) as { response: number };

  const button = buttons[response];
  if (!button?.action) {
    return null;
  }

  return await button.action();
}

export async function showToast(options: ToastOptions) {
  const Toast = (await import('src/components/Toast.vue')).default;
  const toast = createApp({
    render() {
      return h(Toast, { ...options });
    },
  });
  replaceAndAppendMount(toast, 'toast-target');
}

function replaceAndAppendMount(app: App<Element>, replaceId: string) {
  const fragment = document.createDocumentFragment();
  const target = document.getElementById(replaceId);
  if (target === null) {
    return;
  }

  const parent = target.parentElement;
  const clone = target.cloneNode();

  // @ts-ignore
  app.mount(fragment);
  target.replaceWith(fragment);
  parent!.append(clone);
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

  return await showMessageDialog({
    message: t`Delete ${schemaLabel} ${doc.name!}?`,
    detail,
    buttons: [
      {
        label: t`Delete`,
        async action() {
          try {
            await doc.delete();
            return true;
          } catch (err) {
            if (getDbError(err as Error) === LinkValidationError) {
              showMessageDialog({
                message: t`Delete Failed`,
                detail: t`Cannot delete ${schemaLabel} ${doc.name!} because of linked entries.`,
              });
            } else {
              handleErrorWithDialog(err as Error, doc);
            }

            return false;
          }
        },
      },
      {
        label: t`Cancel`,
        action() {
          return false;
        },
      },
    ],
  });
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

  const schemaLabel = fyo.schemaMap[doc.schemaName]!.label;
  return await showMessageDialog({
    message: t`Cancel ${schemaLabel} ${doc.name!}?`,
    detail,
    buttons: [
      {
        label: t`Yes`,
        async action() {
          try {
            await doc.cancel();
            return true;
          } catch (err) {
            handleErrorWithDialog(err as Error, doc);
            return false;
          }
        },
      },
      {
        label: t`No`,
        action() {
          return false;
        },
      },
    ],
  });
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
      const res = await cancelDocWithPrompt(doc);
      if (!res) {
        return;
      }

      showActionToast(doc, 'cancel');
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
      const res = await deleteDocWithPrompt(doc);
      if (!res) {
        return;
      }

      showActionToast(doc, 'delete');
      router.back();
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
        handleErrorWithDialog(err as Error, doc);
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
    const tab = field.tab ?? 'Default';
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

  if (
    [
      ModelNameEnum.SalesInvoice,
      ModelNameEnum.PurchaseInvoice,
      ModelNameEnum.JournalEntry,
      ModelNameEnum.Shipment,
      ModelNameEnum.PurchaseReceipt,
      ModelNameEnum.StockMovement,
      ModelNameEnum.Payment,
      ModelNameEnum.Item,
    ].includes(schemaName as ModelNameEnum)
  ) {
    return `/edit/${schemaName}/${name}`;
  }

  return `/list/${schemaName}?edit=1&schemaName=${schemaName}&name=${name}`;
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
  ref: any,
  clear: boolean = true
) {
  const naming = doc.fyo.schemaMap[doc.schemaName]?.naming;
  if (naming !== 'manual' || doc.inserted) {
    return;
  }

  if (Array.isArray(ref) && ref.length > 0) {
    ref = ref[0];
  }

  if (!clear && typeof ref?.select === 'function') {
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
  const { success, canceled, filePath, data, name } = await selectFile(options);

  if (canceled || !success) {
    await showToast({
      type: 'error',
      message: t`File selection failed`,
    });
    return {};
  }

  const text = new TextDecoder().decode(data);
  if (!text) {
    await showToast({
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

export async function commonDocSync(doc: Doc): Promise<boolean> {
  try {
    await doc.sync();
  } catch (error) {
    handleErrorWithDialog(error, doc);
    return false;
  }

  showActionToast(doc, 'sync');
  return true;
}

export async function commonDocSubmit(doc: Doc): Promise<boolean> {
  const success = await showSubmitDialog(doc);
  if (!success) {
    return false;
  }

  showSubmitToast(doc);
  return true;
}

async function showSubmitDialog(doc: Doc) {
  const label = doc.schema.label ?? doc.schemaName;
  const message = t`Submit ${label}?`;
  const yesAction = async () => {
    try {
      await doc.submit();
    } catch (error) {
      handleErrorWithDialog(error, doc);
      return false;
    }

    return true;
  };

  const buttons = [
    {
      label: t`Yes`,
      action: yesAction,
    },
    {
      label: t`No`,
      action: () => false,
    },
  ];

  return await showMessageDialog({
    message,
    buttons,
  });
}

function showActionToast(doc: Doc, type: 'sync' | 'cancel' | 'delete') {
  const label = getToastLabel(doc);
  const message = {
    sync: t`${label} saved`,
    cancel: t`${label} cancelled`,
    delete: t`${label} deleted`,
  }[type];

  showToast({ type: 'success', message, duration: 2500 });
}

function showSubmitToast(doc: Doc) {
  const label = getToastLabel(doc);
  const message = t`${label} submitted`;
  const toastOption: ToastOptions = {
    type: 'success',
    message,
    duration: 5000,
    ...getSubmitSuccessToastAction(doc),
  };
  showToast(toastOption);
}

function getToastLabel(doc: Doc) {
  const label = doc.schema.label ?? doc.schemaName;
  if (doc.schema.naming === 'random') {
    return label;
  }

  return doc.name ?? label;
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
