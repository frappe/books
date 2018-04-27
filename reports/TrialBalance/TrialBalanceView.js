const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');

module.exports = class TrialBalanceView extends ReportPage {
    constructor(opts) {
        super({
            title: frappe._('Trial Balance'),
            filterFields: [
                {fieldtype: 'Date', fieldname: 'fromDate', label: 'From Date', required: 1},
                {fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1}
            ]
        });

        this.method = 'trial-balance';
        this.datatableOptions = {
            treeView: true,
            layout: 'fixed'
        }
    }

    async setDefaultFilterValues() {
        const accountingSettings = await frappe.getSingle('AccountingSettings');
        this.filters.setValue('fromDate', accountingSettings.fiscalYearStart);
        this.filters.setValue('toDate', accountingSettings.fiscalYearEnd);

        this.run();
    }

    getRowsForDataTable(data) {
        return data.rows || [];
    }

    getColumns(data) {
        const columns = [
            { label: 'Account', fieldtype: 'Data', fieldname: 'account', width: 340 },
            { label: 'Opening (Dr)', fieldtype: 'Currency', fieldname: 'openingDebit' },
            { label: 'Opening (Cr)', fieldtype: 'Currency', fieldname: 'openingCredit' },
            { label: 'Debit', fieldtype: 'Currency', fieldname: 'debit' },
            { label: 'Credit', fieldtype: 'Currency', fieldname: 'credit' },
            { label: 'Closing (Dr)', fieldtype: 'Currency', fieldname: 'closingDebit' },
            { label: 'Closing (Cr)', fieldtype: 'Currency', fieldname: 'closingCredit' }
        ];

        return columns;
    }
}
