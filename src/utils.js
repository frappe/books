import Avatar from '@/components/Avatar';
import router from '@/router';
import { ipcRenderer } from 'electron';
import frappe from 'frappejs';
import { _ } from 'frappejs/utils';
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
  let errorMessage = e.message || _('An error occurred');
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
  ipcRenderer.invoke(IPC_ACTIONS.SAVE_HTML_AS_PDF, html, savePath);
}

export async function makeJSON(data, savePath) {
  ipcRenderer.invoke(IPC_ACTIONS.SAVE_REPORT_AS_JSON, data, savePath);
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

export const statusColor = {
  Draft: 'gray',
  Unpaid: 'orange',
  Paid: 'green',
  Cancelled: 'red',
};

export function getInvoiceStatus(doc) {
  let status = 'Unpaid';
  if (!doc.submitted) {
    status = 'Draft';
  }
  if (doc.submitted === 1 && doc.outstandingAmount === 0.0) {
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
