const Invoice = require('../Invoice/Invoice');
const Quotation = Invoice;

Quotation.name = "Quotation";
Quotation.label = "Quotation";
Quotation.settings = "QuotationSettings";

module.exports = Quotation;
