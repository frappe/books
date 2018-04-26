const model = require('frappejs/model');
const InvoiceSettings = require('../InvoiceSettings/InvoiceSettings');

module.exports = model.extend(InvoiceSettings, {
    "name": "QuotationSettings",
    "label": "Quotation Settings",
    "fields": [
        {
            "fieldname": "numberSeries",
            "default": "QTN"
        }
    ]
});
