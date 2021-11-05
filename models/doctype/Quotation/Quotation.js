import model from 'frappejs/model';
import SalesInvoice from '../SalesInvoice/SalesInvoice';

const Quotation = model.extend(
  SalesInvoice,
  {
    name: 'Quotation',
    label: 'Quotation',
    settings: 'QuotationSettings',
    fields: [
      {
        fieldname: 'items',
        childtype: 'QuotationItem'
      }
    ],
    links: []
  },
  {
    skipFields: ['account'],
    overrideProps: ['links']
  }
);

export default Quotation;
