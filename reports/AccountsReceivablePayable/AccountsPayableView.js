const frappe = require('frappejs');
const ReportPage = require('frappejs/client/desk/reportpage');
const { DateTime } = require('luxon');

module.exports = class AccountsReceivableView extends ReportPage {
    constructor(opts) {
        super({
            title: frappe._('Accounts Payable'),
            filterFields: [
                {fieldtype: 'Date', fieldname: 'date', label: 'As on Date', required: 1},
            ]
        });

        this.method = 'accounts-payable';
        this.datatableOptions = {
            layout: 'fixed'
        }
    }

    async setDefaultFilterValues() {
        const today = DateTime.local();
        this.filters.setValue('date', today.toISODate());
        this.run();
    }

    getRowsForDataTable(data) {
        return data.rows || [];
    }

    getColumns() {
        const columns = [
            { label: 'Posting Date', fieldtype: 'Data', fieldname: 'date' },
            { label: 'Supplier', fieldtype: 'Data', fieldname: 'party' },
            { label: 'Voucher Type', fieldtype: 'Data', fieldname: 'voucherType' },
            { label: 'Voucher No', fieldtype: 'Data', fieldname: 'voucherNo' },
            { label: 'Due Date', fieldtype: 'Data', fieldname: 'dueDate' },
        ];

        return columns;
    }
}
