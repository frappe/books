global.rootRequire = function(name) {
    return require(process.cwd() + '/' + name);
}

const server = require('frappejs/server');
const frappe = require('frappejs');
const GeneralLedger = require('../reports/generalLedger/GeneralLedger');
const naming = require('frappejs/model/naming');

module.exports = {
    async start() {
        await server.start({
            backend: 'sqlite',
            connectionParams: { dbPath: 'test.db' },
            staticPath: './www',
            models: require('../models')
        })

        await this.postStart();
    },

    async postStart() {
        // set server-side modules
        frappe.models.Invoice.documentClass = require('../models/doctype/Invoice/InvoiceServer.js');
        frappe.models.Payment.documentClass = require('../models/doctype/Payment/PaymentServer.js');
        frappe.models.JournalEntry.documentClass = require('../models/doctype/JournalEntry/JournalEntryServer.js');

        frappe.metaCache = {};

        frappe.syncDoc(require('../fixtures/invoicePrint'));

        // init naming series if missing
        await naming.createNumberSeries('INV-', 'InvoiceSettings');
        await naming.createNumberSeries('PAY-', 'PaymentSettings');
        await naming.createNumberSeries('JV-', 'JournalEntrySettings');
        await naming.createNumberSeries('QTN-', 'QuotationSettings');

        frappe.registerMethod({
            method: 'general-ledger',
            handler: args => GeneralLedger(args)
        });
    }
}
