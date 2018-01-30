const frappe = require('frappejs');
const Search = require('./search');
const Router = require('frappejs/common/router');
const Page = require('frappejs/client/view/page');
const FormPage = require('frappejs/client/desk/formpage');
const ListPage = require('frappejs/client/desk/listpage');
const Navbar = require('./navbar');

module.exports = class Desk {
    constructor() {
        frappe.router = new Router();
        frappe.router.listen();

        let body = document.querySelector('body');
        this.navbar = new Navbar();
        this.container = frappe.ui.add('div', 'container-fluid', body);

        this.container_row = frappe.ui.add('div', 'row', this.container)
        this.sidebar = frappe.ui.add('div', 'col-md-2 p-3 sidebar', this.container_row);
        this.body = frappe.ui.add('div', 'col-md-10 p-3 main', this.container_row);

        this.sidebar_items = [];
        this.pages = {
            lists: {},
            forms: {}
        };

        this.init_routes();

        // this.search = new Search(this.nav);
    }

    init_routes() {
        frappe.router.add('not-found', async (params) => {
            if (!this.not_found_page) {
                this.not_found_page = new Page('Not Found');
            }
            await this.not_found_page.show();
            this.not_found_page.render_error('Not Found', params ? params.route : '');
        })

        frappe.router.add('list/:doctype', async (params) => {
            let page = this.get_list_page(params.doctype);
            await page.show(params);
        });

        frappe.router.add('edit/:doctype/:name', async (params) => {
            let page = this.get_form_page(params.doctype);
            await page.show(params);
        })

        frappe.router.add('new/:doctype', async (params) => {
            let doc = await frappe.get_new_doc(params.doctype);
            // unset the name, its local
            await frappe.router.set_route('edit', doc.doctype, doc.name);
            await doc.set('name', '');
        });

    }

    get_list_page(doctype) {
        if (!this.pages.lists[doctype]) {
            this.pages.lists[doctype] = new ListPage(doctype);
        }
        return this.pages.lists[doctype];
    }

    get_form_page(doctype) {
        if (!this.pages.forms[doctype]) {
            this.pages.forms[doctype] = new FormPage(doctype);
        }
        return this.pages.forms[doctype];
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