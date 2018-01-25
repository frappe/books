const frappe = require('frappejs');
const Search = require('./search');
const Router = require('frappejs/common/router');
const Page = require('frappejs/client/view/page');
const BaseList = require('frappejs/client/view/list');
const BaseForm = require('frappejs/client/view/form');
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
            let page = new Page('List ' + frappe.get_meta(doctype).name);
            page.list = new (this.get_view_class(doctype, 'List', BaseList))({
                doctype: doctype,
                parent: page.body
            });
            page.on('show', async () => {
                await page.list.run();
            });
            this.pages.lists[doctype] = page;
        }
        return this.pages.lists[doctype];
    }

    get_form_page(doctype) {
        if (!this.pages.forms[doctype]) {
            let page = new Page('Edit ' + frappe.get_meta(doctype).name);
            page.form = new (this.get_view_class(doctype, 'Form', BaseForm))({
                doctype: doctype,
                parent: page.body
            });
            page.on('show', async (params) => {
                try {
                    page.doc = await frappe.get_doc(params.doctype, params.name);
                    page.form.use(page.doc);
                } catch (e) {
                    page.render_error(e.status_code, e.message);
                }
            });
            this.pages.forms[doctype] = page;
        }
        return this.pages.forms[doctype];
    }

    get_view_class(doctype, class_name, default_class) {
        let client_module = this.get_client_module(doctype);
        if (client_module && client_module[class_name]) {
            return client_module[class_name];
        } else {
            return default_class;
        }

    }

    get_client_module(doctype) {
        return frappe.modules[`${doctype}_client`];
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