const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');
const frappe = require('frappejs');

module.exports = class FormPage extends Page {
    constructor(doctype) {
        let meta = frappe.getMeta(doctype);
        super({title: `Edit ${meta.name}`, hasRoute: true});
        this.wrapper.classList.add('page-form');
        this.meta = meta;
        this.doctype = doctype;

        this.form = new (view.getFormClass(doctype))({
            doctype: doctype,
            parent: this.body,
            container: this,
            actions: ['save', 'delete', 'duplicate', 'settings', 'print']
        });

        if (this.meta.pageSettings && this.meta.pageSettings.hideTitle) {
            this.titleElement.classList.add('hide');
        }

        // if name is different after saving, change the route
        this.form.on('save', async (params) => {
            let route = frappe.router.getRoute();
            if (this.form.doc.name && !(route && route[2] === this.form.doc.name)) {
                await frappe.router.setRoute('edit', this.form.doc.doctype, this.form.doc.name);
                frappe.ui.showAlert({message: 'Added', color: 'green'});
            }
        });

        this.form.on('delete', async (params) => {
            this.hide();
            await frappe.router.setRoute('list', this.form.doctype);
        });
    }

    async show(params) {
        super.show();
        try {
            await this.form.setDoc(params.doctype, params.name);
            frappe.desk.setActiveDoc(this.form.doc);
        } catch (e) {
            this.renderError(e.status_code, e.message);
        }
    }
}
