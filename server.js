const server = require('frappejs/server');
const frappe = require('frappejs');

server.start({
    backend: 'sqlite',
    connectionParams: {dbPath: 'test.db'},
    static: './',
    models: require('./models')
}).then(() => {
    frappe.syncDoc(require('./fixtures/invoicePrint'));
});