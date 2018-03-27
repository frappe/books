const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');

module.exports = class GeneralLedgerView extends ReportPage {
    constructor() {
        super({title: frappe._('General Ledger')});

        this.addFilter({fieldtype: 'Link', target: 'Account', label: 'Account'});
        this.addFilter({fieldtype: 'Link', target: 'Party', label: 'Party'});
        this.addFilter({fieldtype: 'Date', label: 'From Date'});
        this.addFilter({fieldtype: 'Date', label: 'To Date'});

        this.method = 'general-ledger';
    }

    getColumns() {
        return [
            {label: 'Date', fieldtype: 'Date'},
            {label: 'Account', fieldtype: 'Link'},
            {label: 'Party', fieldtype: 'Link'},
            {label: 'Description', fieldtype: 'Data'},
            {label: 'Debit', fieldtype: 'Currency'},
            {label: 'Credit', fieldtype: 'Currency'},
            {label: 'Balance', fieldtype: 'Currency'}
        ]
    }
}

