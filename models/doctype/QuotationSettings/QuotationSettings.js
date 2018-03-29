const InvoiceSettings = require('../InvoiceSettings/InvoiceSettings');
const QuotationSettings = InvoiceSettings;
QuotationSettings.name = "QuotationSettings";
QuotationSettings.label = "Quotation Settings";
QuotationSettings.fields.find((field)=>{
    if (field.fieldname == "numberSeries") field.default = "QTN";
});
module.exports = QuotationSettings;