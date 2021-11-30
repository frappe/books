import config from '@/config';
import { ipcRenderer } from 'electron';
import { _ } from 'frappejs';
import SQLiteDatabase from 'frappejs/backends/sqlite';
import fs from 'fs';
import postStart from '../server/postStart';
import { IPC_ACTIONS } from './messages';
import migrate from './migrate';

export async function createNewDatabase() {
  const options = {
    title: _('Select folder'),
    defaultPath: 'frappe-books.db',
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

export async function connectToLocalDatabase(filePath) {
  if (!filePath) {
    return false;
  }

  frappe.login('Administrator');
  try {
    frappe.db = new SQLiteDatabase({
      dbPath: filePath,
    });
    await frappe.db.connect();
  } catch (error) {
    console.error(error);
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
      ...files,
    ];
    config.set('files', files);
  }

  // set last selected file
  config.set('lastSelectedFilePath', filePath);
  return true;
}

export function purgeCache(purgeAll = false) {
  const filterFunction = purgeAll
    ? (d) => true
    : (d) => frappe.docs[d][d] instanceof frappe.BaseMeta;

  Object.keys(frappe.docs)
    .filter(filterFunction)
    .forEach((d) => {
      frappe.removeFromCache(d, d);
      delete frappe[d];
    });
}
