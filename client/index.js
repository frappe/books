const common = require('frappejs/common');
const RESTClient = require('frappejs/backends/rest_client');
const frappe = require('frappejs');
frappe.ui = require('./ui');
const Desk = require('./desk');

module.exports = {
    async start({server, columns = 2}) {
        window.frappe = frappe;
        frappe.init();
        common.init_libs(frappe);

        frappe.fetch = window.fetch.bind();
        frappe.db = await new RESTClient({server: server});

        frappe.flags.cache_docs = true;

        frappe.desk = new Desk(columns);
        await frappe.login();
    }
};

