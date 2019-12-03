import frappe from 'frappejs';
import { _ } from 'frappejs';
import { remote } from 'electron';

export function createNewDatabase() {
  return new Promise(resolve => {
    remote.dialog.showSaveDialog(
      remote.getCurrentWindow(),
      {
        title: _('Select folder'),
        defaultPath: 'frappe-accounting.db'
      },
      filePath => {
        if (filePath) {
          if (!filePath.endsWith('.db')) {
            filePath = filePath + '.db';
          }
          resolve(filePath);
        }
      }
    );
  });
}

export function loadExistingDatabase() {
  return new Promise(resolve => {
    remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        title: _('Select file'),
        properties: ['openFile'],
        filters: [{ name: 'SQLite DB File', extensions: ['db'] }]
      },
      files => {
        if (files && files[0]) {
          resolve(files[0]);
        }
      }
    );
  });
}

export function showMessageDialog({ message, description, buttons = [] }) {
  let buttonLabels = buttons.map(a => a.label);
  remote.dialog.showMessageBox(
    remote.getCurrentWindow(),
    {
      message,
      detail: description,
      buttons: buttonLabels
    },
    response => {
      let button = buttons[response];
      if (button && button.action) {
        button.action();
      }
    }
  );
}

export function deleteDocWithPrompt(doc) {
  return new Promise((resolve, reject) => {
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
                let errorMessage;
                if (e instanceof frappe.errors.LinkValidationError) {
                  errorMessage = _('{0} {1} is linked with existing records.', [
                    doc.doctype,
                    doc.name
                  ]);
                } else {
                  errorMessage = _('An error occurred.');
                }
                showMessageDialog({
                  message: errorMessage
                });
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
