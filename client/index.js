const common = require('frappe-core/common');
const RESTClient = require('frappe-core/backends/rest_client');
const frappe = require('frappe-core');
frappe.ui = require('./ui');
const Desk = require('./desk');

module.exports = {
    async start({server, container}) {
        window.frappe = frappe;
        frappe.init();
        common.init_libs(frappe);

        frappe.fetch = window.fetch.bind();
        frappe.db = await new RESTClient({server: server});

        frappe.flags.cache_docs = true;

        frappe.desk = new Desk();
        await frappe.login();
    }
};

