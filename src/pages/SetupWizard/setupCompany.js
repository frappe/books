import frappe from 'frappejs';
import countryList from '~/fixtures/countryInfo.json';
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
    fiscalYearEnd
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
    currency: countryList[country]['currency']
  });

  const printSettings = await frappe.getSingle('PrintSettings');
  printSettings.update({
    logo: companyLogo,
    companyName,
    email,
    displayLogo: companyLogo ? 1 : 0
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
      number_format: numberFormat
    } = country;

    if (currency) {
      const exists = queue.includes(currency);
      if (!exists) {
        const doc = await frappe.newDoc({
          doctype: 'Currency',
          name: currency,
          fraction,
          fractionUnits,
          smallestValue,
          symbol,
          numberFormat: numberFormat || '#,###.##'
        });
        promises.push(doc.insert());
        queue.push(currency);
      }
    }
  }
  return Promise.all(promises);
}

async function setupChartOfAccounts(bankName) {
  await frappe.call({
    method: 'import-coa'
  });

  const accountDoc = await frappe.newDoc({
    doctype: 'Account'
  });
  Object.assign(accountDoc, {
    name: bankName,
    rootType: 'Asset',
    parentAccount: 'Bank Accounts',
    accountType: 'Bank',
    isGroup: 0
  });
  accountDoc.insert();
}

async function setupRegionalChanges(country) {
  const generateRegionalTaxes = require('~/models/doctype/Tax/RegionalChanges');
  await generateRegionalTaxes(country);
  if (country === 'India') {
    frappe.models.Party = require('~/models/doctype/Party/RegionalChanges');
    await frappe.db.migrate();
  }
}

function updateCompanyNameInConfig() {
  let filePath = frappe.db.dbPath;
  let files = config.get('files', []);
  files.forEach(file => {
    if (file.filePath === filePath) {
      file.companyName = frappe.AccountingSettings.companyName;
    }
  });
  config.set('files', files);
}
