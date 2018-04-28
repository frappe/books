const model = require('frappejs/model');
const PurchaseOrderItem = require('../PurchaseOrderItem/PurchaseOrderItem');

module.exports = model.extend(PurchaseOrderItem, {
    name: "PurchaseReceiptItem",
    fields: [
        {
            "fieldname": "acceptedQuantity",
            "label": "Accepted Quantity",
            "fieldtype": "Float",
            "required": 1
        }
    ]
}, {
    skipFields: ['expenseAccount']
});
