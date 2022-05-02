/**
 * Utils to do UI stuff such as opening dialogs, toasts, etc.
 * Basically anything that may directly or indirectly import a Vue file.
 */
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { getActions } from 'fyo/utils';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import router from 'src/router';
import { IPC_ACTIONS } from 'utils/messages';
import { App, createApp, h } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { stringifyCircular } from './';
import {
  MessageDialogOptions,
  QuickEditOptions,
  SettingsTab,
  ToastOptions,
} from './types';

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
        purpose === 'sales'
          ? 'purchases'
          : purpose === 'purchases'
          ? 'sales'
          : 'both',
    });
  }

  if (forWhat[0] === 'not in' && forWhat[1] === 'sales') {
    defaults = Object.assign({ for: 'purchases' });
  }

  router[method]({
    query: {
      edit: 1,
      schemaName,
      name,
      showFields,
      hideFields,
      defaults: stringifyCircular(defaults),
      /*
      lastRoute: currentRoute,
      */
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
  if (button && button.action) {
    button.action();
  }
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

export function openSettings(tab: SettingsTab) {
  routeTo({ path: '/settings', query: { tab } });
}

export async function routeTo(route: string | RouteLocationRaw) {
  let routeOptions = route;
  if (
    typeof route === 'string' &&
    route === router.currentRoute.value.fullPath
  ) {
    return;
  }

  if (typeof route === 'string') {
    routeOptions = { path: route };
  }

  await router.push(routeOptions);
}

export function deleteDocWithPrompt(doc: Doc) {
  return new Promise((resolve) => {
    showMessageDialog({
      message: t`Are you sure you want to delete ${
        doc.schemaName
      } ${doc.name!}?`,
      detail: t`This action is permanent`,
      buttons: [
        {
          label: t`Delete`,
          action: () => {
            doc
              .delete()
              .then(() => resolve(true))
              .catch((e: Error) => {
                handleErrorWithDialog(e, doc);
              });
          },
        },
        {
          label: t`Cancel`,
          action() {
            resolve(false);
          },
        },
      ],
    });
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

  return new Promise((resolve) => {
    showMessageDialog({
      message: t`Are you sure you want to cancel ${
        doc.schemaName
      } ${doc.name!}?`,
      detail,
      buttons: [
        {
          label: t`Yes`,
          async action() {
            const entryDoc = await fyo.doc.getDoc(doc.schemaName, doc.name!);
            entryDoc
              .cancel()
              .then(() => resolve(true))
              .catch((e) => handleErrorWithDialog(e, doc));
          },
        },
        {
          label: t`No`,
          action() {
            resolve(false);
          },
        },
      ],
    });
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
    condition: (doc: Doc) => !doc.cancelled,
    action: () => {
      cancelDocWithPrompt(doc).then((res) => {
        if (res) {
          router.push(`/list/${doc.schemaName}`);
        }
      });
    },
  };
}

function getDeleteAction(doc: Doc): Action {
  return {
    label: t`Delete`,
    component: {
      template: '<span class="text-red-700">{{ t`Delete` }}</span>',
    },
    condition: (doc: Doc) =>
      !doc.notInserted &&
      !doc.submitted &&
      !doc.schema.isSingle &&
      !doc.cancelled,
    action: () =>
      deleteDocWithPrompt(doc).then((res) => {
        if (res) {
          routeTo(`/list/${doc.schemaName}`);
        }
      }),
  };
}

function getDuplicateAction(doc: Doc): Action {
  const isSubmittable = !!doc.schema.isSubmittable;
  return {
    label: t`Duplicate`,
    condition: (doc: Doc) =>
      !!(
        ((isSubmittable && doc && doc.submitted) || !isSubmittable) &&
        !doc._notInserted &&
        !(doc.cancelled || false)
      ),
    action: () => {
      showMessageDialog({
        message: t`Duplicate ${doc.schemaName} ${doc.name!}?`,
        buttons: [
          {
            label: t`Yes`,
            async action() {
              doc.duplicate();
            },
          },
          {
            label: t`No`,
            action() {
              // no-op
            },
          },
        ],
      });
    },
  };
}
