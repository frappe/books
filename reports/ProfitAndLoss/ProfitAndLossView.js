const frappe = require('frappejs');
const FinancialStatementsView = require('../FinancialStatements/FinancialStatementsView');

module.exports = class ProfitAndLossView extends FinancialStatementsView {
    constructor() {
        super({
            title: frappe._('Profit and Loss'),
            method: 'profit-and-loss',
            filterFields: [
                {fieldtype: 'Date', label: 'From Date', required: 1},
                {fieldtype: 'Date', label: 'To Date', required: 1},
                {fieldtype: 'Select', options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
                    label: 'Periodicity', fieldname: 'periodicity', default: 'Monthly'}
            ]
        });
    }
}
