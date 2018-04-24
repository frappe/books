const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');
const { unique } = require('frappejs/utils');

module.exports = class FinancialStatementsView extends ReportPage {
    constructor(opts) {
        super({
            title: opts.title,
            filterFields: opts.filterFields
        });

        this.method = opts.method;
        this.datatableOptions = {
            treeView: true,
            layout: 'fixed'
        }
    }

    getRowsForDataTable(data) {
        return data.rows || [];
    }

    getColumns(data) {
        const columns = [
            { label: 'Account', fieldtype: 'Data', fieldname: 'account', width: 340 }
        ];

        if (data && data.columns) {
            const currencyColumns = data.columns;
            const columnDefs = currencyColumns.map(name => ({
                label: name,
                fieldname: name,
                fieldtype: 'Currency'
            }));

            columns.push(...columnDefs);
        }

        return columns;
    }
}
