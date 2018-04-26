const frappe = require('frappejs');
const FinancialStatementsView = require('../FinancialStatements/FinancialStatementsView');

module.exports = class ProfitAndLossView extends FinancialStatementsView {
    constructor() {
        super({
            title: frappe._('Profit and Loss'),
            method: 'profit-and-loss',
            filterFields: [
                {fieldtype: 'Date', fieldname: 'fromDate', label: 'From Date', required: 1},
                {fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1},
                {fieldtype: 'Select', options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
                    label: 'Periodicity', fieldname: 'periodicity', default: 'Monthly'}
            ]
        });
    }

    async setDefaultFilterValues() {
        const accountingSettings = await frappe.getSingle('AccountingSettings');
        this.filters.setValue('fromDate', accountingSettings.fiscalYearStart);
        this.filters.setValue('toDate', accountingSettings.fiscalYearEnd);
        this.filters.setValue('periodicity', 'Monthly');

        this.run();
    }
}
