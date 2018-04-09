const frappe = require('frappejs');
const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');

module.exports = class TreePage extends Page {
    constructor(name) {
        const hasRoute = true;

        super({
            title: frappe._("Tree"),
            parent: hasRoute ? frappe.desk.body : frappe.desk.center,
            hasRoute: hasRoute
        });

        this.fullPage = true;

        this.name = name;

        this.tree = new (view.getTreeClass(name))({
            doctype: name,
            parent: this.body,
            page: this
        });
    }

    async show(params) {
        super.show();
        this.setTitle(this.name===this.tree.meta.name ? (this.tree.meta.label || this.tree.meta.name) : this.name);
        await this.tree.refresh();
    }
}