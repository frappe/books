const BaseList = require('frappejs/client/view/list');
const frappe = require('frappejs');

module.exports = class InvoiceList extends BaseList {
    getFields()  {
        return ['name', 'customer', 'grandTotal', 'submitted'];
    }
    getRowHTML(data) {
        return `<div class="col-3">${this.getNameHTML(data)}</div>
                <div class="col-4 text-muted">${data.customer}</div>
                <div class="col-4 text-muted text-right">${frappe.format(data.grandTotal, "Currency")}</div>`;
    }
}