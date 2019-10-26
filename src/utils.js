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
