import { Fyo } from 'fyo';
import setupInstance from 'src/setup/setupInstance';
import { getFiscalYear } from 'utils/misc';
import items from './items.json';
import parties from './parties.json';

export async function setupDummyInstance(dbPath: string, fyo: Fyo) {
  await setupInstance(
    dbPath,
    {
      logo: null,
      companyName: "Flo's Clothes",
      country: 'India',
      fullname: 'Lin Florentine',
      email: 'lin@flosclothes.com',
      bankName: 'Supreme Bank',
      currency: 'INR',
      fiscalYearStart: getFiscalYear('04-01', true),
      fiscalYearEnd: getFiscalYear('04-01', false),
      chartOfAccounts: 'India - Chart of Accounts',
    },
    fyo
  );

  await generateEntries(fyo);
}

async function generateEntries(fyo: Fyo) {
  await generateItems(fyo);
  await generateParties(fyo);
}

async function generateItems(fyo: Fyo) {
  for (const item of items) {
    const doc = fyo.doc.getNewDoc('Item', item, false);
    await doc.sync();
  }
}

async function generateParties(fyo: Fyo) {
  for (const party of parties) {
    const doc = fyo.doc.getNewDoc('Party', party, false);
    await doc.sync();
  }
}
