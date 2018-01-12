const frappe = require('frappe-core');
const Search = require('./search');
const Router = require('./router');

module.exports = class Desk {
    constructor() {
        frappe.router = new Router();

        this.wrapper = document.querySelector('.desk');

        this.nav = frappe.ui.add('header', 'nav text-center', this.wrapper);

        this.body = frappe.ui.add('div', 'desk-body two-column', this.wrapper);
        this.sidebar = frappe.ui.add('div', 'sidebar', this.body);
        this.main = frappe.ui.add('div', 'main', this.body);

        this.sidebar_items = [];
        this.list_pages = {};
        this.edit_pages = {};

        // this.search = new Search(this.nav);
    }

    init_routes() {
        frappe.router.on('list/:doctype', (params) => {

        })
        frappe.router.on('edit/:doctype/:name', (params) => {

        })

    }

    add_sidebar_item(label, action) {
        let item = frappe.ui.add('a', '', frappe.ui.add('p', null, frappe.desk.sidebar));
        item.textContent = label;
        if (typeof action === 'string') {
            item.href = action;
        } else {
            item.addEventHandler('click', () => {
                action();
            });
        }
    }

}