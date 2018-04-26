const model = require('frappejs/model');
const Invoice = require('../Invoice/Invoice');

const Quotation = model.extend(Invoice, {
    name: "Quotation",
    label: "Quotation",
    settings: "QuotationSettings",
    fields: [
        {
            "fieldname": "items",
            "childtype": "QuotationItem"
        }
    ],
    links: []
}, {
    skipFields: ['account'],
    overrideProps: ['links']
});

module.exports = Quotation;
