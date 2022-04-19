import frappe from 'fyo';
import standardCOA from '../fixtures/verified/standardCOA.json';
import { getCOAList } from '../src/utils';
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
    const doc = frappe.doc.getNewDoc('Account', {
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

export async function getCountryCOA(chartOfAccounts) {
  const coaList = getCOAList();
  const coa = coaList.find(({ name }) => name === chartOfAccounts);
  const conCode = coa.countryCode;
  if (!conCode) {
    return standardCOA;
  }

  try {
    const countryCoa = (
      await import('../fixtures/verified/' + conCode + '.json')
    ).default;
    return countryCoa.tree;
  } catch (e) {
    return standardCOA;
  }
}

export default async function importCharts(chartOfAccounts) {
  const chart = await getCountryCOA(chartOfAccounts);
  await importAccounts(chart, '', '', true);
}
