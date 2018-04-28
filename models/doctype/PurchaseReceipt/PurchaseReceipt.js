const model = require('frappejs/model');
const PurchaseOrder = require('../PurchaseOrder/PurchaseOrder');

module.exports = model.extend(PurchaseOrder, {
    name: "PurchaseReceipt",
    label: "Purchase Receipt",
    settings: "PurchaseReceiptSettings",
    fields: [
        {
            "fieldname": "items",
            "childtype": "PurchaseReceiptItem"
        }
    ]
});
