import config from '@/config';
import SQLiteDatabase from 'frappe/backends/sqlite';
import fs from 'fs';
import regionalModelUpdates from '../models/regionalModelUpdates';
import postStart, { setCurrencySymbols } from '../server/postStart';
import { DB_CONN_FAILURE } from './messages';
import runMigrate from './migrate';
import { getId } from './telemetry/helpers';
import telemetry from './telemetry/telemetry';
import { callInitializeMoneyMaker, getSavePath } from './utils';

export async function createNewDatabase() {
  const { canceled, filePath } = await getSavePath('books', 'db');
  if (canceled || filePath.length === 0) {
    return '';
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return filePath;
}

async function runRegionalModelUpdates() {
  if (!(await frappe.db.knex.schema.hasTable('SingleValue'))) {
    return;
  }

  const { country, setupComplete } = await frappe.db.get('AccountingSettings');
  if (!parseInt(setupComplete)) return;
  await regionalModelUpdates({ country });
}

export async function connectToLocalDatabase(filePath) {
  if (!filePath) {
    return { connectionSuccess: false, reason: DB_CONN_FAILURE.INVALID_FILE };
  }

  frappe.auth.login('Administrator');
  try {
    frappe.db = new SQLiteDatabase({
      dbPath: filePath,
    });
    await frappe.db.connect();
  } catch (error) {
    console.error(error);
    return { connectionSuccess: false, reason: DB_CONN_FAILURE.CANT_CONNECT };
  }

  // first init no currency, for migratory needs
  await callInitializeMoneyMaker();

  try {
    await runRegionalModelUpdates();
  } catch (error) {
    console.error('regional model updates failed', error);
  }

  try {
    await runMigrate();
    await postStart();
  } catch (error) {
    if (!error.message.includes('SQLITE_CANTOPEN')) {
      throw error;
    }

    console.error(error);
    return { connectionSuccess: false, reason: DB_CONN_FAILURE.CANT_OPEN };
  }

  // set file info in config
  const { companyName } = frappe.AccountingSettings;
  let files = config.get('files') || [];
  if (
    !files.find(
      (file) => file.filePath === filePath && file.companyName === companyName
    )
  ) {
    files = [
      {
        companyName,
        id: getId(),
        filePath,
      },
      ...files.filter((file) => file.filePath !== filePath),
    ];
    config.set('files', files);
  }

  // set last selected file
  config.set('lastSelectedFilePath', filePath);

  // second init with currency, normal usage
  await callInitializeMoneyMaker();
  await telemetry.start();

  if (frappe.store.isDevelopment) {
    // @ts-ignore
    window.telemetry = telemetry;
  }

  return { connectionSuccess: true, reason: '' };
}

export async function purgeCache(purgeAll = false) {
  const filterFunction = purgeAll
    ? () => true
    : (d) => frappe.docs[d][d] instanceof frappe.Meta;

  Object.keys(frappe.docs)
    .filter(filterFunction)
    .forEach((d) => {
      frappe.removeFromCache(d, d);
      delete frappe[d];
    });

  if (purgeAll) {
    delete frappe.db;
    const models = (await import('../models')).default;
    await frappe.initializeAndRegister(models, true);
  }
}

export async function postSetup() {
  await setCurrencySymbols();
}
