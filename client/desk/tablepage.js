const Page = require('frappejs/client/view/page');
const frappe = require('frappejs');
const ModelTable = require('frappejs/client/ui/modelTable');

module.exports = class TablePage extends Page {
    constructor(doctype) {
        let meta = frappe.getMeta(doctype);
        super({title: `${meta.label || meta.name}`, hasRoute: true});
        this.tableWrapper = frappe.ui.add('div', 'table-page-wrapper', this.body);
        this.doctype = doctype;
        this.fullPage = true;

        this.addButton('Set Filters', 'btn-secondary', async () => {
            const formModal = await frappe.desk.showFormModal('FilterSelector');
            formModal.form.once('apply-filters', () => {
                formModal.hide();
                this.run();
            })
        });

    }

    async show(params) {
        super.show();

        if (!this.filterSelector) {
            this.filterSelector = await frappe.getSingle('FilterSelector');
            this.filterSelector.reset(this.doctype);
        }

        if (!this.modelTable) {
            this.modelTable = new ModelTable({
                doctype: this.doctype,
                parent: this.tableWrapper,
                layout: 'fluid'
            });
        }

        this.run();
    }

    async run() {
        const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
            filters: this.filterSelector.getFilters(),
            start: this.start,
            limit: 500
        });
        this.modelTable.refresh(data);
    }
}