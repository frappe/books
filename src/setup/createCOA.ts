import {
  AccountRootType,
  COAChildAccount,
  COARootAccount,
  COATree,
} from 'models/baseModels/Account/types';
import { getCOAList } from 'models/baseModels/SetupWizard/SetupWizard';
import { fyo } from 'src/initFyo';
import { getStandardCOA } from './standardCOA';

const accountFields = ['accountType', 'accountNumber', 'rootType', 'isGroup'];

function getAccountName(accountName: string, accountNumber?: string) {
  if (accountNumber) {
    return `${accountName} - ${accountNumber}`;
  }

  return accountName;
}

async function createCOAAccounts(
  children: COATree | COARootAccount | COAChildAccount,
  parentAccount: string,
  rootType: AccountRootType | '',
  rootAccount: boolean
) {
  for (const rootName in children) {
    if (accountFields.includes(rootName)) {
      continue;
    }

    const child = children[rootName];

    if (rootAccount) {
      rootType = (child as COARootAccount).rootType as AccountRootType;
    }

    const accountType = (child as COAChildAccount).accountType ?? '';
    const accountNumber = (child as COAChildAccount).accountNumber;
    const accountName = getAccountName(rootName, accountNumber);

    const isGroup = identifyIsGroup(child as COAChildAccount | COARootAccount);
    const doc = fyo.doc.getNewDoc('Account', {
      name: accountName,
      parentAccount,
      isGroup,
      rootType,
      balance: 0,
      accountType,
    });

    await doc.insert();
    await createCOAAccounts(
      child as COAChildAccount,
      accountName,
      rootType,
      false
    );
  }
}

function identifyIsGroup(child: COARootAccount | COAChildAccount): boolean {
  if (child.isGroup !== undefined) {
    return child.isGroup as boolean;
  }

  const keys = Object.keys(child);
  const children = keys.filter((key) => !accountFields.includes(key));

  if (children.length) {
    return true;
  }

  return false;
}

async function getCOA(chartOfAccounts: string) {
  const coaList = getCOAList();
  const coa = coaList.find(({ name }) => name === chartOfAccounts);

  const conCode = coa?.countryCode;
  if (!conCode) {
    return getStandardCOA();
  }

  try {
    const countryCoa = (await import('fixtures/verified/' + conCode + '.json'))
      .default;
    return countryCoa.tree;
  } catch (e) {
    return getStandardCOA();
  }
}

export async function createCOA(chartOfAccounts: string) {
  const chart = await getCOA(chartOfAccounts);
  await createCOAAccounts(chart, '', '', true);
}
