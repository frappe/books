const frappe = require('frappejs');
const naming = require('frappejs/model/naming');
const registerServerMethods = require('./registerServerMethods');

module.exports = async function postStart() {
  // set server-side modules
  frappe.models.Invoice.documentClass = require('../models/doctype/Invoice/InvoiceServer.js');
  frappe.models.Payment.documentClass = require('../models/doctype/Payment/PaymentServer.js');
  frappe.models.Bill.documentClass = require('../models/doctype/Bill/BillServer.js');
  frappe.models.JournalEntry.documentClass = require('../models/doctype/JournalEntry/JournalEntryServer.js');
  frappe.models.GSTR3B.documentClass = require('../models/doctype/GSTR3B/GSTR3BServer.js');

  frappe.metaCache = {};

  frappe.syncDoc(require('../fixtures/invoicePrint'));

  // init naming series if missing
  await naming.createNumberSeries('INV-', 'InvoiceSettings');
  await naming.createNumberSeries('BILL-', 'BillSettings');
  await naming.createNumberSeries('PAY-', 'PaymentSettings');
  await naming.createNumberSeries('JV-', 'JournalEntrySettings');
  await naming.createNumberSeries('QTN-', 'QuotationSettings');
  await naming.createNumberSeries('SO-', 'SalesOrderSettings');
  await naming.createNumberSeries('OF-', 'FulfillmentSettings');
  await naming.createNumberSeries('PO-', 'PurchaseOrderSettings');
  await naming.createNumberSeries('PREC-', 'PurchaseReceiptSettings');

  registerServerMethods();
};
