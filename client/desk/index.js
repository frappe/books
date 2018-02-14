const frappe = require('frappejs');
// const Search = require('./search');
const Router = require('frappejs/common/router');
const Page = require('frappejs/client/view/page');
const FormPage = require('frappejs/client/desk/formpage');
const ListPage = require('frappejs/client/desk/listpage');
const Navbar = require('./navbar');
const FormModal = require('frappejs/client/desk/formmodal');

module.exports = class Desk {
    constructor() {
        frappe.router = new Router();
        frappe.router.listen();

        let body = document.querySelector('body');
        this.navbar = new Navbar();
        this.container = frappe.ui.add('div', 'container-fluid', body);

        this.containerRow = frappe.ui.add('div', 'row', this.container)
        this.sidebar = frappe.ui.add('div', 'col-md-2 sidebar d-none d-md-block', this.containerRow);
        this.sidebarList = frappe.ui.add('div', 'list-group list-group-flush', this.sidebar);
        this.body = frappe.ui.add('div', 'col-md-10 main', this.containerRow);

        this.pages = {
            lists: {},
            forms: {},
            formModals: {}
        };

        this.routeItems = {};

        this.initRoutes();
        // this.search = new Search(this.nav);
    }

    initRoutes() {
        frappe.router.add('not-found', async (params) => {
            if (!this.notFoundPage) {
                this.notFoundPage = new Page('Not Found');
            }
            await this.notFoundPage.show();
            this.notFoundPage.renderError('Not Found', params ? params.route : '');
        })

        frappe.router.add('list/:doctype', async (params) => {
            let page = this.getListPage(params.doctype);
            await page.show(params);
        });

        frappe.router.add('edit/:doctype/:name', async (params) => {
            let page = this.getFormPage(params.doctype);
            await page.show(params);
        })

        frappe.router.add('new/:doctype', async (params) => {
            let doc = await frappe.getNewDoc(params.doctype);
            // unset the name, its local
            await frappe.router.setRoute('edit', doc.doctype, doc.name);
        });

        frappe.router.on('change', () => {
            if (this.routeItems[window.location.hash]) {
                this.setActive(this.routeItems[window.location.hash]);
            }
        })

    }

    getListPage(doctype) {
        if (!this.pages.lists[doctype]) {
            this.pages.lists[doctype] = new ListPage(doctype);
        }
        return this.pages.lists[doctype];
    }

    getFormPage(doctype) {
        if (!this.pages.forms[doctype]) {
            this.pages.forms[doctype] = new FormPage(doctype);
        }
        return this.pages.forms[doctype];
    }

    showFormModal(doctype, name) {
        if (!this.pages.formModals[doctype]) {
            this.pages.formModals[doctype] = new FormModal(doctype, name);
        } else {
            this.pages.formModals[doctype].showWith(doctype, name);
        }
        return this.pages.formModals[doctype];
    }

    setActive(item) {
        let className = 'list-group-item-secondary';
        let activeItem = this.sidebarList.querySelector('.' + className);
        if (activeItem) {
            activeItem.classList.remove(className);
        }
        item.classList.add(className);
    }

    addSidebarItem(label, action) {
        let item = frappe.ui.add('a', 'list-group-item list-group-item-action', this.sidebarList);
        item.textContent = label;
        if (typeof action === 'string') {
            item.href = action;
            this.routeItems[action] = item;
        } else {
            item.addEventHandler('click', () => {
                action();
                this.setActive(item);
            });
        }
    }

}