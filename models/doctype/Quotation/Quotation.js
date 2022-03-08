import { t } from 'frappe';
import model from 'frappe/model';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';
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
      {
        fieldname: 'numberSeries',
        label: t`Number Series`,
        fieldtype: 'Link',
        target: 'NumberSeries',
        required: 1,
        getFilters: () => {
          return { referenceType: 'Quotation' };
        },
        default: DEFAULT_NUMBER_SERIES['Quotation'],
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
