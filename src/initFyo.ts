import { Fyo } from 'fyo';
import { getRegionalModels, models } from 'models';
import { ModelNameEnum } from 'models/types';
import { getRandomString, getValueMapFromList } from 'utils';

export const fyo = new Fyo({ isTest: false, isElectron: true });

async function closeDbIfConnected() {
  if (!fyo.db.isConnected) {
    return;
  }

  await fyo.db.close();
}

export async function initializeInstance(
  dbPath: string,
  isNew: boolean,
  countryCode: string,
  fyo: Fyo
) {
  if (isNew) {
    await closeDbIfConnected();
    countryCode = await fyo.db.createNewDatabase(dbPath, countryCode);
  } else if (!fyo.db.isConnected) {
    countryCode = await fyo.db.connectToDatabase(dbPath);
  }

  const regionalModels = await getRegionalModels(countryCode);
  await fyo.initializeAndRegister(models, regionalModels);

  await setSingles(fyo);
  await setCreds(fyo);
  await setVersion(fyo);
  await setInstanceId(fyo);
  await setCurrencySymbols(fyo);
}

async function setSingles(fyo: Fyo) {
  await fyo.doc.getDoc(ModelNameEnum.AccountingSettings);
  await fyo.doc.getDoc(ModelNameEnum.GetStarted);
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

async function setInstanceId(fyo: Fyo) {
  const systemSettings = await fyo.doc.getDoc(ModelNameEnum.SystemSettings);
  if (!systemSettings.instanceId) {
    await systemSettings.setAndSync('instanceId', getRandomString());
  }
}

async function setCurrencySymbols(fyo: Fyo) {
  const currencies = (await fyo.db.getAll(ModelNameEnum.Currency, {
    fields: ['name', 'symbol'],
  })) as { name: string; symbol: string }[];

  fyo.currencySymbols = getValueMapFromList(
    currencies,
    'name',
    'symbol'
  ) as Record<string, string | undefined>;
}
