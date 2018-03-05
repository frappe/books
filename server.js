const server = require('frappejs/server');
const frappe = require('frappejs');

server.start({
    backend: 'sqlite',
    connectionParams: {dbPath: 'test.db'},
    static: './',
    models: require('./models')
}).then(() => {
    // set server-side modules
    frappe.models.Invoice.documentClass = require('./models/doctype/Invoice/InvoiceServer.js');
    frappe.metaCache = {};

    frappe.syncDoc(require('./fixtures/invoicePrint'));
});