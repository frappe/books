const Page = require('frappejs/client/view/page');
const Form = require('frappejs/client/view/form');
const DataTable = require('frappe-datatable');
const frappe = require('frappejs');
const utils = require('frappejs/client/ui/utils');
const Observable = require('frappejs/utils/observable');

// baseclass for report
// `url` url for report
// `getColumns` return columns

module.exports = class ReportPage extends Page {
    constructor({title, filterFields = []}) {
        super({title: title, hasRoute: true});

        this.fullPage = true;
        this.filterFields = filterFields;

        this.filterWrapper = frappe.ui.add('div', 'filter-toolbar', this.body);
        this.tableWrapper = frappe.ui.add('div', 'table-page-wrapper', this.body);

        this.btnNew = this.addButton(frappe._('Refresh'), 'btn-primary', async () => {
            await this.run();
        });

        this.makeFilters();
    }

    getColumns() {
        // overrride
    }

    getRowsForDataTable(data) {
        return data;
    }

    makeFilters() {
        this.form = new Form({
            parent: this.filterWrapper,
            meta: { fields: this.filterFields },
            doc: new Observable(),
            inline: true,
            container: this
        });
    }

    getFilterValues() {
        const values = {};
        for (let control of this.form.formLayout.controlList) {
            values[control.fieldname] = control.getInputValue();
            if (control.required && !values[control.fieldname]) {
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
        if (frappe.params && frappe.params.filters) {
            for (let key in frappe.params.filters) {
                if (this.form.controls[key]) {
                    this.form.controls[key].setInputValue(frappe.params.filters[key]);
                }
            }
        }
        frappe.params = null;


        if (!this.datatable) {
            this.makeDataTable();
        }

        const filterValues = this.getFilterValues();
        if (filterValues === false) return;

        let data = await frappe.call({
            method: this.method,
            args: filterValues
        });

        const rows = this.getRowsForDataTable(data);
        this.datatable.refresh(rows);
    }

    makeDataTable() {
        this.datatable = new DataTable(this.tableWrapper, Object.assign({
            columns: utils.convertFieldsToDatatableColumns(this.getColumns(), this.layout),
            data: [],
            layout: this.layout || 'fluid',
        }, this.datatableOptions || {}));
    }
}