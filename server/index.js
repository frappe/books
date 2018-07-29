const path = require('path');
const server = require('frappejs/server');
const frappe = require('frappejs');
const naming = require('frappejs/model/naming');
const registerReportMethods = require('../reports');

async function start() {
    await server.start({
        backend: 'sqlite',
        connectionParams: { dbPath: 'test.db', enableCORS: true },
        staticPath: path.resolve(__dirname, '../www'),
        models: require('../models')
    })

    await postStart();
}

async function postStart() {
    // set server-side modules
    frappe.models.Invoice.documentClass = require('../models/doctype/Invoice/InvoiceServer.js');
    frappe.models.Payment.documentClass = require('../models/doctype/Payment/PaymentServer.js');
    frappe.models.Bill.documentClass = require('../models/doctype/Bill/BillServer.js');
    frappe.models.JournalEntry.documentClass = require('../models/doctype/JournalEntry/JournalEntryServer.js');

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

    registerReportMethods();
}

start();

module.exports = {
    start,
    postStart
}