import frappe from 'frappejs';
import fs from 'fs';
import { _ } from 'frappejs/utils';
import migrate from './migrate';
import { ipcRenderer } from 'electron';
import { IPC_MESSAGES, IPC_ACTIONS } from './messages';
import SQLite from 'frappejs/backends/sqlite';
import postStart from '../server/postStart';
import router from '@/router';
import Avatar from '@/components/Avatar';
import config from '@/config';

export async function createNewDatabase() {
  const options = {
    title: _('Select folder'),
    defaultPath: 'frappe-books.db'
  };

  let { canceled, filePath } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_SAVE_FILEPATH,
    options
  );

  if (canceled || filePath.length === 0) {
    return '';
  }

  if (!filePath.endsWith('.db')) {
    showMessageDialog({
      message: "Please select a filename ending with '.db'.",
    });
    return '';
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return filePath;
}

export async function loadExistingDatabase() {
  const options = {
    title: _('Select file'),
    properties: ['openFile'],
    filters: [{ name: 'SQLite DB File', extensions: ['db'] }]
  };

  const { filePaths } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_OPEN_FILEPATH,
    options
  );

  if (filePaths && filePaths[0]) {
    return filePaths[0];
  }
}

export async function connectToLocalDatabase(filePath) {
  if (!filePath) {
    return false;
  }

  frappe.login('Administrator');
  try {
    frappe.db = new SQLite({
      dbPath: filePath,
    });
    await frappe.db.connect();
  } catch (error) {
    return false;
  }

  await migrate();
  await postStart();

  // set file info in config
  let files = config.get('files') || [];
  if (!files.find((file) => file.filePath === filePath)) {
    files = [
      {
        companyName: frappe.AccountingSettings.companyName,
        filePath: filePath,
      },
      ...files
    ];
    config.set('files', files);
  }

  // set last selected file
  config.set('lastSelectedFilePath', filePath);
  return true;
}

export async function showMessageDialog({
  message,
  description,
  buttons = []
}) {
  const options = {
    message,
    detail: description,
    buttons: buttons.map(a => a.label)
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

export function deleteDocWithPrompt(doc) {
  return new Promise(resolve => {
    showMessageDialog({
      message: _('Are you sure you want to delete {0} "{1}"?', [
        doc.doctype,
        doc.name
      ]),
      description: _('This action is permanent'),
      buttons: [
        {
          label: _('Delete'),
          action: () => {
            doc
              .delete()
              .then(() => resolve(true))
              .catch(e => {
                handleErrorWithDialog(e, doc);
              });
          }
        },
        {
          label: _('Cancel'),
          action() {
            resolve(false);
          }
        }
      ]
    });
  });
}

export function cancelDocWithPrompt(doc) {
  return new Promise(resolve => {
    showMessageDialog({
      message: _('Are you sure you want to cancel {0} "{1}"?', [
        doc.doctype,
        doc.name
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
              .catch(e => {
                handleErrorWithDialog(e, doc);
              });
          }
        },
        {
          label: _('No'),
          action() {
            resolve(false);
          }
        }
      ]
    });
  });
}

export function partyWithAvatar(party) {
  return {
    data() {
      return {
        imageURL: null,
        label: null
      };
    },
    components: {
      Avatar
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
    `
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
  router[method]({
    query: {
      edit: 1,
      doctype,
      name,
      hideFields,
      values: defaults,
      lastRoute: currentRoute
    }
  });
}

export function getErrorMessage(e, doc) {
  let errorMessage = e.message || _('An error occurred');
  const { doctype, name } = doc;
  const canElaborate = doctype && name;
  if (e.type === frappe.errors.LinkValidationError && canElaborate) {
    errorMessage = _('{0} {1} is linked with existing records.', [
      doctype,
      name
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

export function getActionsForDocument(doc) {
  if (!doc) return [];

  let deleteAction = {
    component: {
      template: `<span class="text-red-700">{{ _('Delete') }}</span>`
    },
    condition: doc =>
      !doc.isNew() && !doc.submitted && !doc.cancelled && !doc.meta.isSingle,
    action: () =>
      deleteDocWithPrompt(doc).then(res => {
        if (res) {
          router.push(`/list/${doc.doctype}`);
        }
      })
  };

  let cancelAction = {
    component: {
      template: `<span class="text-red-700">{{ _('Cancel') }}</span>`
    },
    condition: doc =>
      doc.submitted &&
      !doc.cancelled &&
      doc.baseGrandTotal !== doc.outstandingAmount,
    action: () => {
      cancelDocWithPrompt(doc).then(res => {
        if (res) {
          router.push(`/list/${doc.doctype}`);
        }
      });
    }
  };

  let actions = [...(doc.meta.actions || []), deleteAction, cancelAction]
    .filter(d => (d.condition ? d.condition(doc) : true))
    .map(d => {
      return {
        label: d.label,
        component: d.component,
        action: d.action.bind(this, doc, router)
      };
    });

  return actions;
}

export function openSettings(tab = 'General') {
  ipcRenderer.send(IPC_MESSAGES.OPEN_SETTINGS, tab);
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