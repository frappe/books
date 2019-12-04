import frappe from 'frappejs';
import router from '@/router';
import Avatar from '@/components/Avatar';
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
                throw e;
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
