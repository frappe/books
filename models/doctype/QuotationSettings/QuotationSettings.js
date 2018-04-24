const deepmerge = require('deepmerge');
const InvoiceSettings = require('../InvoiceSettings/InvoiceSettings');
const QuotationSettings = deepmerge(InvoiceSettings, {
    "name": "QuotationSettings",
    "label": "Quotation Settings",
    "fields": {
        "default": "INV"
    }
})

module.exports = QuotationSettings;