const model = require('frappejs/model');
const QuotationSettings = require('../QuotationSettings/QuotationSettings');

module.exports = model.extend(QuotationSettings, {
    "name": "SalesOrderSettings",
    "label": "Sales Order Settings",
    "fields": [
        {
            "fieldname": "numberSeries",
            "default": "SO"
        }
    ]
});
