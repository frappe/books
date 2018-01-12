const common = require('frappe-core/common');
const Database = require('frappe-core/backends/rest_client').Database;
const frappe = require('frappe-core');
frappe.ui = require('./ui');
const Desk = require('./desk');

module.exports = {
    async start({server, container}) {
        window.frappe = frappe;
        frappe.init();
        common.init_libs(frappe);

        frappe.fetch = window.fetch.bind();
        frappe.db = await new Database({server: server});

        frappe.desk = new Desk();
        await frappe.login();
    }
};

