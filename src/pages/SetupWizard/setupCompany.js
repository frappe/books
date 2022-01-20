import config from '@/config';
import frappe from 'frappe';
import { DEFAULT_LOCALE } from 'frappe/utils/consts';
import countryList from '~/fixtures/countryInfo.json';
import generateTaxes from '../../../models/doctype/Tax/RegionalEntries';
import regionalModelUpdates from '../../../models/regionalModelUpdates';
import { callInitializeMoneyMaker } from '../../utils';

export default async function setupCompany(setupWizardValues) {
  const {
    companyLogo,
    companyName,
    country,
    name,
    email,
    bankName,
    fiscalYearStart,
    fiscalYearEnd,
  } = setupWizardValues;

  const accountingSettings = frappe.AccountingSettings;
  const currency = countryList[country]['currency'];
  const locale = countryList[country]['locale'] ?? DEFAULT_LOCALE;
  await callInitializeMoneyMaker(currency);

  await accountingSettings.update({
    companyName,
    country,
    fullname: name,
    email,
    bankName,
    fiscalYearStart,
    fiscalYearEnd,
    currency,
  });

  const printSettings = await frappe.getSingle('PrintSettings');
  printSettings.update({
    logo: companyLogo,
    companyName,
    email,
    displayLogo: companyLogo ? 1 : 0,
  });

  await setupGlobalCurrencies(countryList);
  await setupChartOfAccounts(bankName, country);
  await setupRegionalChanges(country);
  updateCompanyNameInConfig();

  await accountingSettings.update({ setupComplete: 1 });
  frappe.AccountingSettings = accountingSettings;

  (await frappe.getSingle('SystemSettings')).update({ locale });
}

async function setupGlobalCurrencies(countries) {
  const promises = [];
  const queue = [];
  for (let country of Object.values(countries)) {
    const {
      currency,
      currency_fraction: fraction,
      currency_fraction_units: fractionUnits,
      smallest_currency_fraction_value: smallestValue,
      currency_symbol: symbol,
    } = country;

    if (!currency || queue.includes(currency)) {
      continue;
    }

    const docObject = {
      doctype: 'Currency',
      name: currency,
      fraction,
      fractionUnits,
      smallestValue,
      symbol,
    };

    const doc = checkAndCreateDoc(docObject);
    if (doc) {
      promises.push(doc);
      queue.push(currency);
    }
  }
  return Promise.all(promises);
}

async function setupChartOfAccounts(bankName, country) {
  await frappe.call({
    method: 'import-coa',
  });
  const parentAccount = await getBankAccountParentName(country);
  const docObject = {
    doctype: 'Account',
    name: bankName,
    rootType: 'Asset',
    parentAccount,
    accountType: 'Bank',
    isGroup: 0,
  };
  await checkAndCreateDoc(docObject);
}

async function setupRegionalChanges(country) {
  await generateTaxes(country);
  await regionalModelUpdates({ country });
  await frappe.db.migrate();
}

function updateCompanyNameInConfig() {
  let filePath = frappe.db.dbPath;
  let files = config.get('files', []);
  files.forEach((file) => {
    if (file.filePath === filePath) {
      file.companyName = frappe.AccountingSettings.companyName;
    }
  });
  config.set('files', files);
}

export async function checkIfExactRecordAbsent(docObject) {
  const { doctype, name } = docObject;
  const newDocObject = Object.assign({}, docObject);
  delete newDocObject.doctype;
  const rows = await frappe.db.knex(doctype).where({ name });

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
    await frappe.db.knex(doctype).where({ name }).del();
    return true;
  }

  return false;
}

async function checkAndCreateDoc(docObject) {
  const canCreate = await checkIfExactRecordAbsent(docObject);
  if (!canCreate) {
    return;
  }

  const doc = await frappe.newDoc(docObject);
  return doc.insert();
}

async function getBankAccountParentName(country) {
  const parentBankAccount = await frappe.db
    .knex('Account')
    .where({ isGroup: true, accountType: 'Bank' });

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
