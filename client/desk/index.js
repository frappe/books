const frappe = require('frappe-core');
const Search = require('./search');
const Router = require('frappe-core/common/router');
const Page = require('frappe-core/client/view/page');
const List = require('frappe-core/client/view/list');
const Form = require('frappe-core/client/view/form');

module.exports = class Desk {
    constructor() {
        frappe.router = new Router();
        frappe.router.listen();

        this.wrapper = document.querySelector('.desk');

        this.nav = frappe.ui.add('header', 'nav text-center', this.wrapper);

        this.body = frappe.ui.add('div', 'desk-body two-column', this.wrapper);
        this.sidebar = frappe.ui.add('div', 'sidebar', this.body);
        this.main = frappe.ui.add('div', 'main', this.body);

        this.sidebar_items = [];
        this.pages = {
            lists: {},
            forms: {}
        };

        this.init_routes();

        // this.search = new Search(this.nav);
    }

    init_routes() {
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
            frappe.router.set_route('edit', doc.doctype, doc.name);
        });

    }

    get_list_page(doctype) {
        if (!this.pages.lists[doctype]) {
            let page = new Page('List ' + doctype);
            page.list = new List({
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
            let page = new Page('Edit ' + doctype);
            page.form = new Form({
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