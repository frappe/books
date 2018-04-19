const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');
const { unique } = require('frappejs/utils');

module.exports = class ProfitAndLossView extends ReportPage {
    constructor() {
        super({
            title: frappe._('Profit and Loss'),
            filterFields: [
                {fieldtype: 'Date', label: 'From Date', required: 1},
                {fieldtype: 'Date', label: 'To Date', required: 1},
                {fieldtype: 'Select', options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
                    label: 'Periodicity', fieldname: 'periodicity'}
            ]
        });

        this.method = 'profit-and-loss';
        this.datatableOptions = {
            treeView: true
        }
    }

    getRowsForDataTable(data) {
        const { expense, income } = data;
        const rows = [];

        rows.push({
            account: 'Income',
            indent: 0
        });
        for (let account of Object.keys(income)) {
            const row = {
                account,
                indent: 1
            };
            for (let periodKey of Object.keys(income[account] || {})) {
                row[periodKey] = income[account][periodKey];
            }
            rows.push(row);
        }

        rows.push({
            account: 'Expense',
            indent: 0
        });
        for (let account of Object.keys(expense)) {
            const row = {
                account,
                indent: 1
            };
            for (let periodKey of Object.keys(expense[account] || {})) {
                row[periodKey] = expense[account][periodKey];
            }
            rows.push(row);
        }

        return rows;
    }

    getColumns(data) {
        debugger
        const columns = [
            { label: 'Account', fieldtype: 'Data' }
        ];

        if (data) {
            const { income, expense } = data;
            let currencyColumns = [];

            for (let account of Object.keys(income)) {
                const periods = Object.keys(income[account] || {});
                currencyColumns.push(...periods);
            }

            for (let account of Object.keys(expense)) {
                const periods = Object.keys(expense[account] || {});
                currencyColumns.push(...periods);
            }

            currencyColumns = unique(currencyColumns);

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
