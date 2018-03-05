const Page = require('frappejs/client/view/page');
const frappe = require('frappejs');
const ModelTable = require('frappejs/client/ui/modelTable');

module.exports = class TablePage extends Page {
    constructor(doctype) {
        let meta = frappe.getMeta(doctype);
        super({title: `${meta.name}`, hasRoute: true});
        this.doctype = doctype;
        this.fullPage = true;
    }


    async show(params) {
        super.show();
        if (!this.modelTable) {
            this.modelTable = new ModelTable({doctype: this.doctype, parent: this.body, layout: 'fixed'});
        }

        const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
            start: this.start,
            limit: 500
        });
        this.modelTable.refresh(data);
    }
}