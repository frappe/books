const frappe = require('frappejs');
// const Search = require('./search');
const Router = require('frappejs/common/router');
const Page = require('frappejs/client/view/page');
const FormPage = require('frappejs/client/desk/formpage');
const ListPage = require('frappejs/client/desk/listpage');
// const Navbar = require('./navbar');
const DeskMenu = require('./menu');
const FormModal = require('frappejs/client/desk/formmodal');

module.exports = class Desk {
    constructor(columns=2) {
        frappe.router = new Router();
        frappe.router.listen();

        let body = document.querySelector('body');
        //this.navbar = new Navbar();
        this.container = frappe.ui.add('div', '', body);
        this.containerRow = frappe.ui.add('div', 'row no-gutters', this.container)
        this.makeColumns(columns);

        this.pages = {
            lists: {},
            forms: {},
            formModals: {}
        };

        this.routeItems = {};

        this.initRoutes();
        // this.search = new Search(this.nav);
    }

    makeColumns(columns) {
        this.menu = null; this.center = null;
        this.columnCount = columns;
        if (columns === 3) {
            this.makeMenu();
            this.center = frappe.ui.add('div', 'col-md-4 desk-center', this.containerRow);
            this.body = frappe.ui.add('div', 'col-md-6 desk-body', this.containerRow);
        } else if (columns === 2) {
            this.makeMenu();
            this.body = frappe.ui.add('div', 'col-md-10 desk-body', this.containerRow);
        } else if (columns === 1) {
            this.makeMenuPage();
            this.body = frappe.ui.add('div', 'col-md-12 desk-body', this.containerRow);
        } else {
            throw 'columns can be 1, 2 or 3'
        }
    }

    makeMenu() {
        this.menuColumn = frappe.ui.add('div', 'col-md-2 desk-menu', this.containerRow);
        this.menu = new DeskMenu(this.menuColumn);
    }

    makeMenuPage() {
        // make menu page for 1 column layout
        this.menuPage = null;
    }

    initRoutes() {
        frappe.router.add('not-found', async (params) => {
            if (!this.notFoundPage) {
                this.notFoundPage = new Page({title: 'Not Found'});
            }
            await this.notFoundPage.show();
            this.notFoundPage.renderError('Not Found', params ? params.route : '');
        })

        frappe.router.add('list/:doctype', async (params) => {
            await this.showListPage(params.doctype);
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
            if (this.menu) {
                this.menu.setActive();
            }
        })

    }

    async showListPage(doctype) {
        if (!this.pages.lists[doctype]) {
            this.pages.lists[doctype] = new ListPage(doctype);
        }
        await this.pages.lists[doctype].show(doctype);
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
            this.pages.formModals[doctype] = new FormModal(doctype);
        }
        this.pages.formModals[doctype].showWith(doctype, name);
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