const RegisterView = require('../Register/RegisterView');
const frappe = require('frappejs');
const { DateTime } = require('luxon');
const { unique } = require('frappejs/utils');

module.exports = class SalesRegisterView extends RegisterView {
    constructor() {
        super({
            title: frappe._('Sales Register'),
            filterFields: [
                { fieldtype: 'Link', target: 'Party', label: 'Customer Name', fieldname: 'customer' },
                { fieldtype: 'Date', fieldname: 'fromDate', label: 'From Date', required: 1 },
                { fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1 }
            ]
        });

        this.method = 'sales-register';
    }

    getColumns() {
        return [
            { label: 'Invoice', fieldname: 'name' },
            { label: 'Posting Date', fieldname: 'date' , fieldtype: 'Date' },
            { label: 'Customer', fieldname: 'customer' },
            { label: 'Receivable Account', fieldname: 'account' },
            { label: 'Net Total', fieldname: 'netTotal', fieldtype: 'Currency' },
            { label: 'Total Tax', fieldname: 'totalTax', fieldtype: 'Currency' },
            { label: 'Grand Total', fieldname: 'grandTotal', fieldtype: 'Currency' },
        ];
    }
}
