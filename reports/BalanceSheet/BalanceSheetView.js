const frappe = require('frappejs');
const FinancialStatementsView = require('../FinancialStatements/FinancialStatementsView');

module.exports = class BalanceSheetView extends FinancialStatementsView {
    constructor() {
        super({
            title: frappe._('Balance Sheet'),
            method: 'balance-sheet',
            filterFields: [
                {fieldtype: 'Date', label: 'To Date', required: 1},
                {fieldtype: 'Select', options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
                    label: 'Periodicity', fieldname: 'periodicity', default: 'Monthly'}
            ]
        });
    }
}
