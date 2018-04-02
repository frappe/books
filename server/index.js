const server = require('frappejs/server');
const frappe = require('frappejs');
const GeneralLedger = require('../reports/generalLedger/GeneralLedger');
const naming = require('frappejs/model/naming');

module.exports = {
    async start() {
        await server.start({
            backend: 'sqlite',
            connectionParams: {dbPath: 'test.db'},
            staticPath: './www',
            models: require('../models')
        })

        // set server-side modules
        frappe.models.Invoice.documentClass = require('../models/doctype/Invoice/InvoiceServer.js');
        frappe.models.Payment.documentClass = require('../models/doctype/Payment/PaymentServer.js');

        frappe.metaCache = {};

        frappe.syncDoc(require('../fixtures/invoicePrint'));

        // init naming series if missing
        await naming.createNumberSeries('INV-', 'InvoiceSettings');
        await naming.createNumberSeries('PAY-', 'PaymentSettings');

        frappe.registerMethod({
            method: 'general-ledger',
            handler: args => GeneralLedger(args)
        });
    }
}
