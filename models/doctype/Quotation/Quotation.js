import { t } from 'frappe';
import model from 'frappe/model';
import SalesInvoice from '../SalesInvoice/SalesInvoice';

const Quotation = model.extend(
  SalesInvoice,
  {
    name: 'Quotation',
    label: t`Quotation`,
    settings: 'QuotationSettings',
    fields: [
      {
        fieldname: 'items',
        childtype: 'QuotationItem',
      },
    ],
    links: [],
  },
  {
    skipFields: ['account'],
    overrideProps: ['links'],
  }
);

export default Quotation;
