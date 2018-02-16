const BaseList = require('frappejs/client/view/list');
const frappe = require('frappejs');

module.exports = class InvoiceList extends BaseList {
    getFields()  {
        return ['name', 'customer', 'total'];
    }
    getRowHTML(data) {
        return `<div class="col-2">${data.name}</div>
                <div class="col-5 text-muted">${data.customer}</div>
                <div class="col-4 text-muted text-right">${frappe.format(data.total, {fieldtype:"Currency"})}</div>`;
    }
}