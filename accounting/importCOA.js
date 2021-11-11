import frappe from 'frappejs';
import countries from '../fixtures/countryInfo.json';
import standardCOA from '../fixtures/verified/standardCOA.json';
const accountFields = ['accountType', 'accountNumber', 'rootType', 'isGroup'];

function getAccountName(accountName, accountNumber) {
  if (accountNumber) {
    return `${accountName} - ${accountNumber}`;
  }
  return accountName;
}

async function importAccounts(children, parentAccount, rootType, rootAccount) {
  for (let rootName in children) {
    if (accountFields.includes(rootName)) {
      continue;
    }

    const child = children[rootName];

    if (rootAccount) {
      rootType = child.rootType;
    }

    const { accountType, accountNumber } = child;
    const accountName = getAccountName(rootName, accountNumber);
    const isGroup = identifyIsGroup(child);
    const doc = frappe.newDoc({
      doctype: 'Account',
      name: accountName,
      parentAccount,
      isGroup,
      rootType,
      balance: 0,
      accountType,
    });

    await doc.insert();
    await importAccounts(child, accountName, rootType);
  }
}

function identifyIsGroup(child) {
  if (child.isGroup) {
    return child.isGroup;
  }

  const keys = Object.keys(child);
  const children = keys.filter((key) => !accountFields.includes(key));

  if (children.length) {
    return 1;
  }

  return 0;
}

export async function getCountryCOA() {
  const doc = await frappe.getDoc('AccountingSettings');
  const conCode = countries[doc.country].code;

  try {
    const countryCoa = (
      await import('../fixtures/verified/' + conCode + '.json')
    ).default;
    return countryCoa.tree;
  } catch (e) {
    return standardCOA;
  }
}

export default async function importCharts() {
  const chart = await getCountryCOA();
  await importAccounts(chart, '', '', true);
}
