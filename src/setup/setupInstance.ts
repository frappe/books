import { ConfigFile, DocValueMap } from 'fyo/core/types';
import Doc from 'fyo/model/doc';
import { createNumberSeries } from 'fyo/model/naming';
import { getId } from 'fyo/telemetry/helpers';
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_SERIES_START,
} from 'fyo/utils/consts';
import { AccountingSettings } from 'models/baseModels/AccountingSettings/AccountingSettings';
import { fyo, initializeInstance } from 'src/initFyo';
import { createRegionalRecords } from 'src/regional';
import { getCountryCodeFromCountry, getCountryInfo } from 'utils/misc';
import { CountryInfo } from 'utils/types';
import { createCOA } from './createCOA';
import { SetupWizardOptions } from './types';

export default async function setupInstance(
  dbPath: string,
  setupWizardOptions: SetupWizardOptions
) {
  const { companyName, country, bankName, chartOfAccounts } =
    setupWizardOptions;

  await initializeDatabase(dbPath, country);
  await updateSystemSettings(setupWizardOptions);
  await updateAccountingSettings(setupWizardOptions);
  await updatePrintSettings(setupWizardOptions);

  await createCurrencyRecords();
  await createAccountRecords(bankName, country, chartOfAccounts);
  await createRegionalRecords(country);
  await createDefaultNumberSeries();

  await completeSetup(companyName);
}

async function initializeDatabase(dbPath: string, country: string) {
  const countryCode = getCountryCodeFromCountry(country);
  await initializeInstance(dbPath, true, countryCode);
}

async function updateAccountingSettings({
  companyName,
  country,
  fullname,
  email,
  bankName,
  fiscalYearStart,
  fiscalYearEnd,
}: SetupWizardOptions) {
  const accountingSettings = (await fyo.doc.getSingle(
    'AccountingSettings'
  )) as AccountingSettings;
  await accountingSettings.setAndUpdate({
    companyName,
    country,
    fullname,
    email,
    bankName,
    fiscalYearStart,
    fiscalYearEnd,
  });
  return accountingSettings;
}

async function updatePrintSettings({
  companyLogo,
  companyName,
  email,
}: SetupWizardOptions) {
  const printSettings = await fyo.doc.getSingle('PrintSettings');
  await printSettings.setAndUpdate({
    logo: companyLogo,
    companyName,
    email,
    displayLogo: companyLogo ? true : false,
  });
}

async function updateSystemSettings({
  country,
  currency: companyCurrency,
}: SetupWizardOptions) {
  const countryInfo = getCountryInfo();
  const countryOptions = countryInfo[country] as CountryInfo;
  const currency =
    companyCurrency ?? countryOptions.currency ?? DEFAULT_CURRENCY;
  const locale = countryOptions.locale ?? DEFAULT_LOCALE;
  const systemSettings = await fyo.doc.getSingle('SystemSettings');
  systemSettings.setAndUpdate({
    locale,
    currency,
  });
}

async function createCurrencyRecords() {
  const promises: Promise<Doc | undefined>[] = [];
  const queue: string[] = [];
  const countrySettings = Object.values(getCountryInfo()) as CountryInfo[];

  for (const country of countrySettings) {
    const {
      currency,
      currency_fraction,
      currency_fraction_units,
      smallest_currency_fraction_value,
      currency_symbol,
    } = country;

    if (!currency || queue.includes(currency)) {
      continue;
    }

    const docObject = {
      name: currency,
      fraction: currency_fraction ?? '',
      fractionUnits: currency_fraction_units ?? 100,
      smallestValue: smallest_currency_fraction_value ?? 0.01,
      symbol: currency_symbol ?? '',
    };

    const doc = checkAndCreateDoc('Currency', docObject);
    if (doc) {
      promises.push(doc);
      queue.push(currency);
    }
  }
  return Promise.all(promises);
}

async function createAccountRecords(
  bankName: string,
  country: string,
  chartOfAccounts: string
) {
  await createCOA(chartOfAccounts);
  const parentAccount = await getBankAccountParentName(country);
  const docObject = {
    name: bankName,
    rootType: 'Asset',
    parentAccount,
    accountType: 'Bank',
    isGroup: false,
  };
  await checkAndCreateDoc('Account', docObject);
}

async function completeSetup(companyName: string) {
  updateInitializationConfig(companyName);
  await fyo.singles.AccountingSettings!.set('setupComplete', true);
  await fyo.singles.AccountingSettings!.update();
}

function updateInitializationConfig(companyName: string) {
  const dbPath = fyo.db.dbPath;
  const files = fyo.config.get('files', []) as ConfigFile[];

  files.forEach((file) => {
    if (file.dbPath === dbPath) {
      file.companyName = companyName;
      file.id = getId();
    }
  });

  fyo.config.set('files', files);
}

async function checkAndCreateDoc(schemaName: string, docObject: DocValueMap) {
  const canCreate = await checkIfExactRecordAbsent(schemaName, docObject);
  if (!canCreate) {
    return;
  }

  const doc = await fyo.doc.getNewDoc(schemaName, docObject);
  return doc.insert();
}

async function checkIfExactRecordAbsent(
  schemaName: string,
  docMap: DocValueMap
) {
  const name = docMap.name as string;
  const newDocObject = Object.assign({}, docMap);

  const rows = await fyo.db.getAllRaw(schemaName, {
    fields: ['*'],
    filters: { name },
  });

  if (rows.length === 0) {
    return true;
  }

  const storedDocObject = rows[0];
  const matchList = Object.keys(newDocObject).map((key) => {
    const newValue = newDocObject[key];
    const storedValue = storedDocObject[key];
    return newValue == storedValue; // Should not be type sensitive.
  });

  if (!matchList.every(Boolean)) {
    await fyo.db.delete(schemaName, name);
    return true;
  }

  return false;
}

async function getBankAccountParentName(country: string) {
  const parentBankAccount = await fyo.db.getAllRaw('Account', {
    fields: ['*'],
    filters: { isGroup: true, accountType: 'Bank' },
  });

  if (parentBankAccount.length === 0) {
    // This should not happen if the fixtures are correct.
    return 'Bank Accounts';
  } else if (parentBankAccount.length > 1) {
    switch (country) {
      case 'Indonesia':
        return 'Bank Rupiah - 1121.000';
      default:
        break;
    }
  }

  return parentBankAccount[0].name;
}

async function createDefaultNumberSeries() {
  await createNumberSeries('SINV-', 'SalesInvoice', DEFAULT_SERIES_START, fyo);
  await createNumberSeries(
    'PINV-',
    'PurchaseInvoice',
    DEFAULT_SERIES_START,
    fyo
  );
  await createNumberSeries('PAY-', 'Payment', DEFAULT_SERIES_START, fyo);
  await createNumberSeries('JV-', 'JournalEntry', DEFAULT_SERIES_START, fyo);
}
