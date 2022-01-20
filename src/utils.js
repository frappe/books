import Avatar from '@/components/Avatar';
import Toast from '@/components/Toast';
import router from '@/router';
import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import { isPesa, _ } from 'frappe/utils';
import lodash from 'lodash';
import Vue from 'vue';
import { IPC_ACTIONS, IPC_MESSAGES } from './messages';

export async function showMessageDialog({
  message,
  description,
  buttons = [],
}) {
  const options = {
    message,
    detail: description,
    buttons: buttons.map((a) => a.label),
  };

  const { response } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_DIALOG_RESPONSE,
    options
  );

  let button = buttons[response];
  if (button && button.action) {
    button.action();
  }
}

export async function showErrorDialog({ title, content }) {
  // To be used for  show stopper errors
  title = title ?? 'Error';
  content =
    content ??
    'Something has gone terribly wrong. Please check the console and raise an issue.';

  await ipcRenderer.invoke(IPC_ACTIONS.SHOW_ERROR, { title, content });
}

export function deleteDocWithPrompt(doc) {
  return new Promise((resolve) => {
    showMessageDialog({
      message: _('Are you sure you want to delete {0} "{1}"?', [
        doc.doctype,
        doc.name,
      ]),
      description: _('This action is permanent'),
      buttons: [
        {
          label: _('Delete'),
          action: () => {
            doc
              .delete()
              .then(() => resolve(true))
              .catch((e) => {
                handleErrorWithDialog(e, doc);
              });
          },
        },
        {
          label: _('Cancel'),
          action() {
            resolve(false);
          },
        },
      ],
    });
  });
}

export function cancelDocWithPrompt(doc) {
  return new Promise((resolve) => {
    showMessageDialog({
      message: _('Are you sure you want to cancel {0} "{1}"?', [
        doc.doctype,
        doc.name,
      ]),
      description: _('This action is permanent'),
      buttons: [
        {
          label: _('Yes'),
          async action() {
            const entryDoc = await frappe.getDoc(doc.doctype, doc.name);
            entryDoc.cancelled = 1;
            await entryDoc.update();
            entryDoc
              .revert()
              .then(() => resolve(true))
              .catch((e) => {
                handleErrorWithDialog(e, doc);
              });
          },
        },
        {
          label: _('No'),
          action() {
            resolve(false);
          },
        },
      ],
    });
  });
}

export function partyWithAvatar(party) {
  return {
    data() {
      return {
        imageURL: null,
        label: null,
      };
    },
    components: {
      Avatar,
    },
    async mounted() {
      this.imageURL = await frappe.db.getValue('Party', party, 'image');
      this.label = party;
    },
    template: `
      <div class="flex items-center" v-if="label">
        <Avatar class="flex-shrink-0" :imageURL="imageURL" :label="label" size="sm" />
        <span class="ml-2 truncate">{{ label }}</span>
      </div>
    `,
  };
}

export function openQuickEdit({ doctype, name, hideFields, defaults = {} }) {
  let currentRoute = router.currentRoute;
  let query = currentRoute.query;
  let method = 'push';
  if (query.edit && query.doctype === doctype) {
    // replace the current route if we are
    // editing another document of the same doctype
    method = 'replace';
  }
  if (query.name === name) return;
  router[method]({
    query: {
      edit: 1,
      doctype,
      name,
      hideFields,
      values: defaults,
      lastRoute: currentRoute,
    },
  });
}

export function getErrorMessage(e, doc) {
  let errorMessage = e.message || _('An error occurred.');
  const { doctype, name } = doc;
  const canElaborate = doctype && name;
  if (e.type === frappe.errors.LinkValidationError && canElaborate) {
    errorMessage = _('{0} {1} is linked with existing records.', [
      doctype,
      name,
    ]);
  } else if (e.type === frappe.errors.DuplicateEntryError && canElaborate) {
    errorMessage = _('{0} {1} already exists.', [doctype, name]);
  }
  return errorMessage;
}

export function handleErrorWithDialog(e, doc) {
  let errorMessage = getErrorMessage(e, doc);
  showMessageDialog({ message: errorMessage });
  throw e;
}

export async function makePDF(html, savePath) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_HTML_AS_PDF, html, savePath);
  showExportInFolder(frappe._('Save as PDF Successful'), savePath);
}

export function showExportInFolder(message, filePath) {
  showToast({
    message,
    actionText: frappe._('Open Folder'),
    type: 'success',
    action: async () => {
      await showItemInFolder(filePath);
    },
  });
}

export async function saveData(data, savePath) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_DATA, data, savePath);
}

export async function showItemInFolder(filePath) {
  await ipcRenderer.send(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, filePath);
}

export function getActionsForDocument(doc) {
  if (!doc) return [];

  let deleteAction = {
    component: {
      template: `<span class="text-red-700">{{ _('Delete') }}</span>`,
    },
    condition: (doc) =>
      !doc.isNew() && !doc.submitted && !doc.meta.isSingle && !doc.cancelled,
    action: () =>
      deleteDocWithPrompt(doc).then((res) => {
        if (res) {
          routeTo(`/list/${doc.doctype}`);
        }
      }),
  };

  let cancelAction = {
    component: {
      template: `<span class="text-red-700">{{ _('Cancel') }}</span>`,
    },
    condition: (doc) => doc.submitted && !doc.cancelled,
    action: () => {
      cancelDocWithPrompt(doc).then((res) => {
        if (res) {
          router.push(`/list/${doc.doctype}`);
        }
      });
    },
  };

  let actions = [...(doc.meta.actions || []), deleteAction, cancelAction]
    .filter((d) => (d.condition ? d.condition(doc) : true))
    .map((d) => {
      return {
        label: d.label,
        component: d.component,
        action: d.action.bind(this, doc, router),
      };
    });

  return actions;
}

export async function runWindowAction(name) {
  switch (name) {
    case 'close':
      ipcRenderer.send(IPC_MESSAGES.CLOSE_CURRENT_WINDOW);
      break;
    case 'minimize':
      ipcRenderer.send(IPC_MESSAGES.MINIMIZE_CURRENT_WINDOW);
      break;
    case 'maximize':
      const maximizing = await ipcRenderer.invoke(
        IPC_ACTIONS.TOGGLE_MAXIMIZE_CURRENT_WINDOW
      );
      name = maximizing ? name : 'unmaximize';
      break;
  }
  return name;
}

export function getInvoiceStatus(doc) {
  let status = 'Unpaid';
  if (!doc.submitted) {
    status = 'Draft';
  }
  if (doc.submitted === 1 && doc.outstandingAmount.isZero()) {
    status = 'Paid';
  }
  if (doc.cancelled === 1) {
    status = 'Cancelled';
  }
  return status;
}

export function routeTo(route) {
  let routeOptions = route;
  if (typeof route === 'string' && route === router.currentRoute.fullPath) {
    return;
  }

  if (typeof route === 'string') {
    routeOptions = { path: route };
  }

  router.push(routeOptions);
}

export function fuzzyMatch(keyword, candidate) {
  const keywordLetters = [...keyword];
  const candidateLetters = [...candidate];

  let keywordLetter = keywordLetters.shift();
  let candidateLetter = candidateLetters.shift();

  let isMatch = true;
  let distance = 0;

  while (keywordLetter && candidateLetter) {
    if (keywordLetter.toLowerCase() === candidateLetter.toLowerCase()) {
      keywordLetter = keywordLetters.shift();
    } else {
      distance += 1;
    }

    candidateLetter = candidateLetters.shift();
  }

  if (keywordLetter !== undefined) {
    distance = -1;
    isMatch = false;
  } else {
    distance += candidateLetters.length;
  }

  return { isMatch, distance };
}

export function openSettings(tab) {
  routeTo({ path: '/settings', query: { tab } });
}

export async function getSavePath(name, extention) {
  let { canceled, filePath } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_SAVE_FILEPATH,
    {
      title: _('Select Folder'),
      defaultPath: `${name}.${extention}`,
    }
  );

  if (filePath && !filePath.endsWith(extention)) {
    filePath = filePath + extention;
  }

  return { canceled, filePath };
}

export function showToast(props) {
  new Vue({
    el: '#toast-target',
    render(createElement) {
      return createElement(Toast, { props });
    },
  });
}

export function titleCase(phrase) {
  return phrase
    .split(' ')
    .map((word) => {
      const wordLower = word.toLowerCase();
      if (['and', 'an', 'a', 'from', 'by', 'on'].includes(wordLower)) {
        return wordLower;
      }
      return lodash.capitalize(wordLower);
    })
    .join(' ');
}

export async function getIsSetupComplete() {
  try {
    const { setupComplete } = await frappe.getSingle('AccountingSettings');
    return !!setupComplete;
  } catch {
    return false;
  }
}

export async function getCurrency() {
  let currency = frappe?.AccountingSettings?.currency ?? undefined;

  if (!currency) {
    try {
      currency = (
        await frappe.db.getSingleValues({
          fieldname: 'currency',
          parent: 'AccountingSettings',
        })
      )[0].value;
    } catch (err) {
      currency = undefined;
    }
  }

  return currency;
}

export async function callInitializeMoneyMaker(currency, force = false) {
  currency ??= await getCurrency();
  if (!force && !currency && frappe.pesa) {
    return;
  }

  if (!force && currency && frappe.pesa().options.currency === currency) {
    return;
  }
  await frappe.initializeMoneyMaker(currency);
}

export function convertPesaValuesToFloat(obj) {
  Object.keys(obj).forEach((key) => {
    if (!isPesa(obj[key])) return;

    obj[key] = obj[key].float;
  });
}
