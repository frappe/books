const model = require('frappejs/model');
const QuotationSettings = require('../QuotationSettings/QuotationSettings');

module.exports = model.extend(QuotationSettings, {
    "name": "FulfillmentSettings",
    "label": "Fulfillment Settings",
    "fields": [
        {
            "fieldname": "numberSeries",
            "default": "OF"
        }
    ]
});
