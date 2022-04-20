import { createNumberSeries } from 'fyo/model/naming';
import { DEFAULT_SERIES_START } from 'fyo/utils/consts';
import { getValueMapFromList } from 'utils';
import { fyo } from './initFyo';

export default async function postStart() {
  await createDefaultNumberSeries();
  await setSingles();
  await setCurrencySymbols();
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

async function setSingles() {
  await fyo.doc.getSingle('AccountingSettings');
  await fyo.doc.getSingle('GetStarted');
}

async function setCurrencySymbols() {
  const currencies = (await fyo.db.getAll('Currency', {
    fields: ['name', 'symbol'],
  })) as { name: string; symbol: string }[];

  fyo.currencySymbols = getValueMapFromList(
    currencies,
    'name',
    'symbol'
  ) as Record<string, string | undefined>;
}
