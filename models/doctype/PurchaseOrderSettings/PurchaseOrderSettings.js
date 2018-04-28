const model = require('frappejs/model');
const BillSettings = require('../BillSettings/BillSettings');

module.exports = model.extend(BillSettings, {
    "name": "PurchaseOrderSettings",
    "label": "Purchase Order Settings",
    "fields": [
        {
            "fieldname": "numberSeries",
            "default": "PO"
        }
    ]
});
