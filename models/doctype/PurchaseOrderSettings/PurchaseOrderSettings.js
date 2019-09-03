const model = require('frappejs/model');
const PurchaseInvoiceSettings = require('../PurchaseInvoiceSettings/PurchaseInvoiceSettings');

module.exports = model.extend(PurchaseInvoiceSettings, {
    "name": "PurchaseOrderSettings",
    "label": "Purchase Order Settings",
    "fields": [
        {
            "fieldname": "numberSeries",
            "default": "PO"
        }
    ]
});
