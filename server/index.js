const server = require('frappejs/server');
const frappe = require('frappejs');
const GeneralLedger = require('../reports/GeneralLedger')

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
        frappe.metaCache = {};

        frappe.syncDoc(require('../fixtures/invoicePrint'));

        frappe.registerMethod({
            method: 'general-ledger',
            handler: async (args) => {
                const generalLedger = new GeneralLedger();
                return await generalLedger.run(args);
            }
        });
    }
}
