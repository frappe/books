/**
 * Utils to do UI stuff such as opening dialogs, toasts, etc.
 * Basically anything that may directly or indirectly import a Vue file.
 */
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { getActions } from 'fyo/utils';
import { getDbError, LinkValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import router from 'src/router';
import { IPC_ACTIONS } from 'utils/messages';
import { App, createApp, h, ref } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { stringifyCircular } from './';
import {
  MessageDialogOptions,
  QuickEditOptions,
  SettingsTab,
  ToastOptions,
} from './types';

export const docsPath = ref('');

export async function openQuickEdit({
  schemaName,
  name,
  hideFields = [],
  showFields = [],
  defaults = {},
}: QuickEditOptions) {
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
    },
  });
}

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

// @ts-ignore
window.st = showToast;

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

export function openSettings(tab: SettingsTab) {
  routeTo({ path: '/settings', query: { tab } });
}

export async function routeTo(route: string | RouteLocationRaw) {
  const routeOptions = route;
  if (
    typeof route === 'string' &&
    route === router.currentRoute.value.fullPath
  ) {
    return;
  }

  if (typeof route === 'string') {
    return await router.push(route);
  }

  return await router.push(routeOptions);
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

export function getActionsForDocument(doc?: Doc): Action[] {
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
        label: d.label,
        component: d.component,
        action: d.action,
      };
    });
}

function getCancelAction(doc: Doc): Action {
  return {
    label: t`Cancel`,
    component: {
      template: '<span class="text-red-700">{{ t`Cancel` }}</span>',
    },
    condition: (doc: Doc) => doc.isSubmitted,
    async action() {
      const res = await cancelDocWithPrompt(doc);

      if (res) {
        router.push(`/list/${doc.schemaName}`);
      }
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
      if (res) {
        router.back();
      }
    },
  };
}

async function openEdit(doc: Doc) {
  const isFormEdit = [
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.JournalEntry,
  ].includes(doc.schemaName as ModelNameEnum);

  if (isFormEdit) {
    return await routeTo(`/edit/${doc.schemaName}/${doc.name!}`);
  }

  await openQuickEdit({ schemaName: doc.schemaName, name: doc.name! });
}

function getDuplicateAction(doc: Doc): Action {
  const isSubmittable = !!doc.schema.isSubmittable;
  return {
    label: t`Duplicate`,
    condition: (doc: Doc) =>
      !!(
        ((isSubmittable && doc.submitted) || !isSubmittable) &&
        !doc.notInserted
      ),
    async action() {
      await showMessageDialog({
        message: t`Duplicate ${doc.schemaName} ${doc.name!}?`,
        buttons: [
          {
            label: t`Yes`,
            async action() {
              try {
                const dupe = await doc.duplicate();
                await openEdit(dupe);
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
    },
  };
}
