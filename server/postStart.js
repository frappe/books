import frappe from 'frappe';
import { createNumberSeries } from 'frappe/model/naming';
import GSTR3BServer from '../models/doctype/GSTR3B/GSTR3BServer.js';
import JournalEntryServer from '../models/doctype/JournalEntry/JournalEntryServer.js';
import PartyServer from '../models/doctype/Party/PartyServer.js';
import PaymentServer from '../models/doctype/Payment/PaymentServer.js';
import PurchaseInvoiceServer from '../models/doctype/PurchaseInvoice/PurchaseInvoiceServer.js';
import SalesInvoiceServer from '../models/doctype/SalesInvoice/SalesInvoiceServer.js';

export default async function postStart() {
  // set server-side modules
  frappe.models.SalesInvoice.documentClass = SalesInvoiceServer;
  frappe.models.Payment.documentClass = PaymentServer;
  frappe.models.Party.documentClass = PartyServer;
  frappe.models.PurchaseInvoice.documentClass = PurchaseInvoiceServer;
  frappe.models.JournalEntry.documentClass = JournalEntryServer;
  frappe.models.GSTR3B.documentClass = GSTR3BServer;

  frappe.metaCache = {};

  // init naming series if missing
  await createNumberSeries('SINV-', 'SalesInvoice');
  await createNumberSeries('PINV-', 'PurchaseInvoice');
  await createNumberSeries('PAY-', 'Payment');
  await createNumberSeries('JV-', 'JournalEntry');
  // await naming.createNumberSeries('QTN-', 'QuotationSettings');
  // await naming.createNumberSeries('SO-', 'SalesOrderSettings');
  // await naming.createNumberSeries('OF-', 'FulfillmentSettings');
  // await naming.createNumberSeries('PO-', 'PurchaseOrderSettings');
  // await naming.createNumberSeries('PREC-', 'PurchaseReceiptSettings');

  // fetch singles
  // so that they are available synchronously
  await frappe.getSingle('SystemSettings');
  await frappe.getSingle('AccountingSettings');
  await frappe.getSingle('GetStarted');

  // cache currency symbols for frappe.format
  await setCurrencySymbols();
}

export async function setCurrencySymbols() {
  frappe.currencySymbols = await frappe.db
    .getAll({
      doctype: 'Currency',
      fields: ['name', 'symbol'],
    })
    .then((data) => {
      return data.reduce((obj, currency) => {
        obj[currency.name] = currency.symbol;
        return obj;
      }, {});
    });
}
