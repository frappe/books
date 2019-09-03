const model = require('frappejs/model');
const SalesInvoiceItem = require('../SalesInvoiceItem/SalesInvoiceItem');

module.exports = model.extend(SalesInvoiceItem, {
    name: "QuotationItem"
});
