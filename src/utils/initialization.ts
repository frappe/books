import { Fyo } from 'fyo';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import { getRegionalModels, models } from 'models/index';
import { ModelNameEnum } from 'models/types';
import { TargetField } from 'schemas/types';
import {
  getMapFromList,
  getRandomString,
  getValueMapFromList,
} from 'utils/index';

export async function initializeInstance(
  dbPath: string,
  isNew: boolean,
  countryCode: string,
  fyo: Fyo
) {
  if (isNew) {
    await closeDbIfConnected(fyo);
    countryCode = await fyo.db.createNewDatabase(dbPath, countryCode);
  } else if (!fyo.db.isConnected) {
    countryCode = await fyo.db.connectToDatabase(dbPath);
  }

  const regionalModels = await getRegionalModels(countryCode);
  await fyo.initializeAndRegister(models, regionalModels);

  await checkSingleLinks(fyo);
  await setSingles(fyo);
  await setCreds(fyo);
  await setVersion(fyo);
  setDeviceId(fyo);
  await setInstanceId(fyo);
  await setOpenCount(fyo);
  await setCurrencySymbols(fyo);
}

async function closeDbIfConnected(fyo: Fyo) {
  if (!fyo.db.isConnected) {
    return;
  }

  await fyo.db.purgeCache();
}

async function setSingles(fyo: Fyo) {
  for (const schema of Object.values(fyo.schemaMap)) {
    if (!schema?.isSingle || schema.name === ModelNameEnum.SetupWizard) {
      continue;
    }

    await fyo.doc.getDoc(schema.name);
  }
}

async function checkSingleLinks(fyo: Fyo) {
  /**
   * Required cause SingleValue tables don't maintain
   * referential integrity. Hence values Linked in the
   * Singles table can be deleted.
   *
   * These deleted links can prevent the db from loading.
   */

  const linkFields = Object.values(fyo.db.schemaMap)
    .filter((schema) => schema?.isSingle)
    .map((schema) => schema!.fields)
    .flat()
    .filter((field) => field.fieldtype === 'Link' && field.target)
    .map((field) => ({
      fieldKey: `${field.schemaName}.${field.fieldname}`,
      target: (field as TargetField).target,
    }));
  const linkFieldsMap = getMapFromList(linkFields, 'fieldKey');

  const singleValues = (await fyo.db.getAllRaw('SingleValue', {
    fields: ['name', 'parent', 'fieldname', 'value'],
  })) as { name: string; parent: string; fieldname: string; value: string }[];

  const exists: Record<string, Record<string, boolean>> = {};

  for (const { name, fieldname, parent, value } of singleValues) {
    const fieldKey = `${parent}.${fieldname}`;
    if (!linkFieldsMap[fieldKey]) {
      continue;
    }

    const { target } = linkFieldsMap[fieldKey];
    if (typeof value !== 'string' || !value || !target) {
      continue;
    }

    exists[target] ??= {};
    if (exists[target][value] === undefined) {
      exists[target][value] = await fyo.db.exists(target, value);
    }

    if (exists[target][value]) {
      continue;
    }

    await fyo.db.delete('SingleValue', name);
  }
}

async function setCreds(fyo: Fyo) {
  const email = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'email'
  )) as string | undefined;
  const user = fyo.auth.user;
  fyo.auth.user = email ?? user;
}

async function setVersion(fyo: Fyo) {
  const version = (await fyo.getValue(
    ModelNameEnum.SystemSettings,
    'version'
  )) as string | undefined;

  const { appVersion } = fyo.store;
  if (version !== appVersion) {
    const systemSettings = await fyo.doc.getDoc(ModelNameEnum.SystemSettings);
    await systemSettings?.setAndSync('version', appVersion);
  }
}

function setDeviceId(fyo: Fyo) {
  let deviceId = fyo.config.get(ConfigKeys.DeviceId) as string | undefined;
  if (deviceId === undefined) {
    deviceId = getRandomString();
    fyo.config.set(ConfigKeys.DeviceId, deviceId);
  }

  fyo.store.deviceId = deviceId;
}

async function setInstanceId(fyo: Fyo) {
  const systemSettings = await fyo.doc.getDoc(ModelNameEnum.SystemSettings);
  if (!systemSettings.instanceId) {
    await systemSettings.setAndSync('instanceId', getRandomString());
  }

  fyo.store.instanceId = (await fyo.getValue(
    ModelNameEnum.SystemSettings,
    'instanceId'
  )) as string;
}

export async function setCurrencySymbols(fyo: Fyo) {
  const currencies = (await fyo.db.getAll(ModelNameEnum.Currency, {
    fields: ['name', 'symbol'],
  })) as { name: string; symbol: string }[];

  fyo.currencySymbols = getValueMapFromList(
    currencies,
    'name',
    'symbol'
  ) as Record<string, string | undefined>;
}

async function setOpenCount(fyo: Fyo) {
  const misc = await fyo.doc.getDoc(ModelNameEnum.Misc);
  let openCount = misc.openCount as number | null;

  if (typeof openCount !== 'number') {
    openCount = getOpenCountFromFiles(fyo);
  }

  if (typeof openCount !== 'number') {
    openCount = 0;
  }

  openCount += 1;
  await misc.setAndSync('openCount', openCount);
}

function getOpenCountFromFiles(fyo: Fyo) {
  const configFile = fyo.config.get(ConfigKeys.Files, []) as ConfigFile[];
  for (const file of configFile) {
    if (file.id === fyo.singles.SystemSettings?.instanceId) {
      return file.openCount ?? 0;
    }
  }

  return null;
}
