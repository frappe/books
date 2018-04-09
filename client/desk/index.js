const frappe = require('frappejs');
// const Search = require('./search');
const Router = require('frappejs/common/router');
const Page = require('frappejs/client/view/page');

const views = {};
views.Form = require('./formpage');
views.List = require('./listpage');
views.Tree = require('./treepage');
views.Print = require('./printpage');
views.FormModal = require('./formmodal');
views.Table = require('./tablepage');
const DeskMenu = require('./menu');

module.exports = class Desk {
    constructor(columns=2) {
        frappe.router = new Router();
        frappe.router.listen();

        let body = document.querySelector('body');
        //this.navbar = new Navbar();
        frappe.ui.empty(body);
        this.container = frappe.ui.add('div', '', body);
        this.containerRow = frappe.ui.add('div', 'row no-gutters', this.container)
        this.makeColumns(columns);

        this.pages = {
            formModals: {},
            List: {}
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
            await this.showViewPage('List', params.doctype);
        });

        frappe.router.add('tree/:doctype', async (params) => {
            await this.showViewPage('Tree', params.doctype);
        });

        frappe.router.add('table/:doctype', async (params) => {
            await this.showViewPage('Table', params.doctype, params);
        })

        frappe.router.add('edit/:doctype/:name', async (params) => {
            await this.showViewPage('Form', params.doctype, params);
        })

        frappe.router.add('print/:doctype/:name', async (params) => {
            await this.showViewPage('Print', params.doctype, params);
        })

        frappe.router.add('new/:doctype', async (params) => {
            let doc = await frappe.getNewDoc(params.doctype);
            // unset the name, its local
            await frappe.router.setRoute('edit', doc.doctype, doc.name);

            // focus on new page
            frappe.desk.body.activePage.body.querySelector('input').focus();
        });

        frappe.router.on('change', () => {
            if (this.menu) {
                this.menu.setActive();
            }
        })
    }

    toggleCenter(show) {
        const current = !frappe.desk.center.classList.contains('hide');
        if (show===undefined) {
            show = current;
        } else if (!!show===!!current) {
            // no change
            return;
        }

        // add hide
        frappe.desk.center.classList.toggle('hide', !show);

        if (show) {
            // set body to 6
            frappe.desk.body.classList.toggle('col-md-6', true);
            frappe.desk.body.classList.toggle('col-md-10', false);
        } else {
            // set body to 10
            frappe.desk.body.classList.toggle('col-md-6', false);
            frappe.desk.body.classList.toggle('col-md-10', true);
        }
    }

    async showViewPage(view, doctype, params) {
        if (!params) params = doctype;
        if (!this.pages[view]) this.pages[view] = {};
        if (!this.pages[view][doctype]) this.pages[view][doctype] = new views[view](doctype);
        const page = this.pages[view][doctype];
        await page.show(params);
    }

    async showFormModal(doctype, name) {
        if (!this.pages.formModals[doctype]) {
            this.pages.formModals[doctype] = new views.FormModal(doctype);
        }
        await this.pages.formModals[doctype].showWith(doctype, name);
        return this.pages.formModals[doctype];
    }

    async setActiveDoc(doc) {
        this.activeDoc = doc;
        if (frappe.desk.center && !frappe.desk.center.activePage) {
            await frappe.desk.showViewPage('List', doc.doctype);
        }
        if (frappe.desk.pages.List[doc.doctype]) {
            frappe.desk.pages.List[doc.doctype].list.setActiveListRow(doc.name);
        }
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
        let item = frappe.ui.add('a', 'list-group-item list-group-item-action', this.sidebarList, label);
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