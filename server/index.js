const path = require('path');
const server = require('frappejs/server');
const postStart = require('./postStart');
const naming = require('frappejs/model/naming');
const registerReportMethods = require('../reports');

async function start() {
    await server.start({
        backend: 'sqlite',
        connectionParams: { dbPath: 'test.db', enableCORS: true },
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

    frappe.registerMethod({
      method: 'import-coa',
      async handler() {
        const standardCOA = require('../fixtures/standardCOA');
        const importCOA = require('../models/doctype/Account/importCOA');
        await importCOA(standardCOA);
      }
    })

    frappe.registerMethod({
      method: 'import-data',
      async handler({doctype, data}) {
        let success = [];
        let failure = [];
        let errorMessage = [];
        for (let d of data) {
          try {
            const doc = await frappe.newDoc(Object.assign(d, {
              doctype: doctype,
            })).insert();
            success.push(doc);
          } catch(e) {
            failure.push(d);
            errorMessage.push(e)
          }
        }
        return {
          errorMessage,
          success,
          failure
        }
      }
    })
}

start();

module.exports = {
    start,
    postStart
}
