const model = require('frappejs/model');
const InvoiceItem = require('../InvoiceItem/InvoiceItem');

module.exports = model.extend(InvoiceItem, {
    name: "QuotationItem"
});
