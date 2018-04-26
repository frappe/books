const frappe = require('frappejs');
const RegisterView = require('../Register/RegisterView');

module.exports = class PurchaseRegisterView extends RegisterView {
    constructor() {
        super({
            title: frappe._('Purchase Register'),
        });

        this.method = 'purchase-register';
    }

    getColumns() {
        return [
            { label: 'Bill', fieldname: 'name' },
            { label: 'Posting Date', fieldname: 'date' },
            { label: 'Supplier', fieldname: 'supplier' },
            { label: 'Payable Account', fieldname: 'account' },
            { label: 'Net Total', fieldname: 'netTotal', fieldtype: 'Currency' },
            { label: 'Total Tax', fieldname: 'totalTax', fieldtype: 'Currency' },
            { label: 'Grand Total', fieldname: 'grandTotal', fieldtype: 'Currency' },
        ];
    }
}
