const frappe = require('frappejs');
const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');

module.exports = class ListPage extends Page {
    constructor(name) {

        // if center column is present, list does not have its route
        const hasRoute = frappe.desk.center ? false : true;

        super({
            title: frappe._("List"),
            parent: hasRoute ? frappe.desk.body : frappe.desk.center,
            hasRoute: hasRoute
        });

        this.list = new (view.getListClass(name))({
            doctype: name,
            parent: this.body,
            page: this
        });

        frappe.docs.on('change', (params) => {
            if (params.doc.doctype === this.list.meta.name) {
                this.list.refreshRow(params.doc);
            }
        });
    }

    async show(params) {
        super.show();
        this.setTitle(name===this.list.doctype ? (this.list.meta.label || this.list.meta.name) : name);
        if (frappe.desk.body.activePage && frappe.router.getRoute()[0]==='list') {
            frappe.desk.body.activePage.hide();
        }
        await this.list.refresh();
    }
}
