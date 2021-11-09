import frappe from 'frappejs';
import countryList from '~/fixtures/countryInfo.json';
import generateTaxes from '../../../models/doctype/Tax/RegionalChanges';
import config from '@/config';

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
  await accountingSettings.update({
    companyName,
    country,
    fullname: name,
    email,
    bankName,
    fiscalYearStart,
    fiscalYearEnd,
    currency: countryList[country]['currency'],
  });

  const printSettings = await frappe.getSingle('PrintSettings');
  printSettings.update({
    logo: companyLogo,
    companyName,
    email,
    displayLogo: companyLogo ? 1 : 0,
  });

  await setupGlobalCurrencies(countryList);
  await setupChartOfAccounts(bankName);
  await setupRegionalChanges(country);
  updateCompanyNameInConfig();

  await frappe.GetStarted.update({ systemSetup: 1, companySetup: 1 });
  await accountingSettings.update({ setupComplete: 1 });
  frappe.AccountingSettings = accountingSettings;
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
      number_format: numberFormat,
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
      numberFormat: numberFormat || '#,###.##',
    };

    const canCreate = await checkIfExactRecordAbsent(docObject);
    if (canCreate) {
      const doc = await frappe.newDoc(docObject);
      promises.push(doc.insert());
      queue.push(currency);
    }
  }
  return Promise.all(promises);
}

async function setupChartOfAccounts(bankName) {
  await frappe.call({
    method: 'import-coa',
  });

  const docObject = {
    doctype: 'Account',
    name: bankName,
    rootType: 'Asset',
    parentAccount: 'Bank Accounts',
    accountType: 'Bank',
    isGroup: 0,
  };

  if (await checkIfExactRecordAbsent(docObject)) {
    const accountDoc = await frappe.newDoc(docObject);
    accountDoc.insert();
  }
}

async function setupRegionalChanges(country) {
  await generateTaxes(country);
  if (country === 'India') {
    frappe.models.Party = await import(
      '../../../models/doctype/Party/RegionalChanges'
    );
    await frappe.db.migrate();
  }
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
