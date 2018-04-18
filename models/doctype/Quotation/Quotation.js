const deepmerge = require('deepmerge');
const Invoice = require('../Invoice/Invoice');

const Quotation = deepmerge(Invoice, {
    name: "Quotation",
    label: "Quotation",
    settings: "QuotationSettings"
});

module.exports = Quotation;
