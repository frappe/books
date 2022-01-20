import model from 'frappe/model';
import SalesInvoiceSettings from '../SalesInvoiceSettings/SalesInvoiceSettings';

export default model.extend(SalesInvoiceSettings, {
  name: 'QuotationSettings',
  label: 'Quotation Settings',
  fields: [
    {
      fieldname: 'numberSeries',
      default: 'QTN',
    },
  ],
});
