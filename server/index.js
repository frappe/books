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

        frappe.app.get('/api/report/general-ledger', frappe.asyncHandler(async function(request, response) {
            const generalLedger = new GeneralLedger();
            const data = await generalLedger.run(request.query);
            response.json(data);
        }));
    }
}
