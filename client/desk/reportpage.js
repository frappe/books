const Page = require('frappejs/client/view/page');
const controls = require('frappejs/client/view/controls');
const DataTable = require('frappe-datatable');
const frappe = require('frappejs');
const utils = require('frappejs/client/ui/utils');

// baseclass for report
// `url` url for report
// `getColumns` return columns

module.exports = class ReportPage extends Page {
    constructor({title, }) {
        super({title: title, hasRoute: true});

        this.fullPage = true;

        this.filterWrapper = frappe.ui.add('div', 'filter-toolbar form-inline', this.body);
        this.tableWrapper = frappe.ui.add('div', 'table-page-wrapper', this.body);

        this.btnNew = this.addButton(frappe._('Refresh'), 'btn-primary', async () => {
            await this.run();
        });

        this.filters = {};
    }

    getColumns() {
        // overrride
    }

    addFilter(field) {
        if (field.fieldname) {
            field.fieldname = frappe.slug(field.label);
        }

        field.placeholder = field.label;
        field.inline = true;

        this.filters[field.fieldname] = controls.makeControl({field: field, form: this, parent: this.filterWrapper});
        return this.filters[field.fieldname];
    }

    getFilterValues() {
        const values = {};
        for (let fieldname in this.filters) {
            let control = this.filters[fieldname];
            values[fieldname] = control.getInputValue();
            if (control.required && !values[fieldname]) {
                frappe.ui.showAlert({message: frappe._('{0} is mandatory', control.label), color: 'red'});
                return false;
            }
        }
        return values;
    }

    async show(params) {
        super.show();
        await this.run();
    }

    async run() {
        if (!this.datatable) {
            this.makeDataTable();
        }

        const filterValues = this.getFilterValues();
        if (filterValues === false) return;

        let data = await frappe.call(this.method, filterValues);
        this.datatable.refresh(data);
    }

    makeDataTable() {
        this.datatable = new DataTable(this.tableWrapper, {
            columns: utils.convertFieldsToDatatableColumns(this.getColumns(), this.layout),
            data: [],
            layout: this.layout || 'fluid',
        });
    }
}