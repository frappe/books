const model = require('frappejs/model');
const PurchaseInvoiceItem = require('../PurchaseInvoiceItem/PurchaseInvoiceItem');

module.exports = model.extend(PurchaseInvoiceItem, {
    name: "PurchaseOrderItem"
});
