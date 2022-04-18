import frappe from 'frappe';
import { createNumberSeries } from 'frappe/model/naming';
import { getValueMapFromList } from 'utils';

export default async function postStart() {
  await createDefaultNumberSeries();
  await setSingles();
  await setCurrencySymbols();
}

async function createDefaultNumberSeries() {
  await createNumberSeries('SINV-', 'SalesInvoice');
  await createNumberSeries('PINV-', 'PurchaseInvoice');
  await createNumberSeries('PAY-', 'Payment');
  await createNumberSeries('JV-', 'JournalEntry');
}

async function setSingles() {
  await frappe.doc.getSingle('AccountingSettings');
  await frappe.doc.getSingle('GetStarted');
}

async function setCurrencySymbols() {
  const currencies = (await frappe.db.getAll('Currency', {
    fields: ['name', 'symbol'],
  })) as { name: string; symbol: string }[];

  frappe.currencySymbols = getValueMapFromList(
    currencies,
    'name',
    'symbol'
  ) as Record<string, string | undefined>;
}
