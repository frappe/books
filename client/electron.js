const common = require('frappejs/common');
const sqlite = require('frappejs/backends/sqlite');
const frappe = require('frappejs');
frappe.ui = require('./ui');
const Desk = require('./desk');
const Observable = require('frappejs/utils/observable');

module.exports = {
    async start({dbPath, columns = 3, models}) {
        window.frappe = frappe;
        frappe.isServer = true;
        frappe.init();
        frappe.registerLibs(common);
        frappe.registerModels(require('frappejs/models'));

        if (models) {
            frappe.registerModels(models);
        }

        frappe.db = await new sqlite({ dbPath });
        await frappe.db.connect();
        await frappe.db.migrate();

        frappe.fetch = window.fetch.bind();

        frappe.docs = new Observable();

        await frappe.getSingle('SystemSettings');

        frappe.desk = new Desk(columns);
        await frappe.login();
    }
};

