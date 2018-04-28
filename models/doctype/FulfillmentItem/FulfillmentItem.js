const model = require('frappejs/model');
const QuotationItem = require('../QuotationItem/QuotationItem');

module.exports = model.extend(QuotationItem, {
    name: "FulfillmentItem"
});
