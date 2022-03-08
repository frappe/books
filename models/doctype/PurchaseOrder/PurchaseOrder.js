import { t } from 'frappe';
import model from 'frappe/model';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';
import PurchaseInvoice from '../PurchaseInvoice/PurchaseInvoice';

export default model.extend(
  PurchaseInvoice,
  {
    name: 'PurchaseOrder',
    label: t`Purchase Order`,
    settings: 'PurchaseOrderSettings',
    fields: [
      {
        fieldname: 'items',
        childtype: 'PurchaseOrderItem',
      },
      {
        fieldname: 'numberSeries',
        label: t`Number Series`,
        fieldtype: 'Link',
        target: 'NumberSeries',
        required: 1,
        getFilters: () => {
          return { referenceType: 'PurchaseOrder' };
        },
        default: DEFAULT_NUMBER_SERIES['PurchaseOrder'],
      },
    ],
  },
  {
    skipFields: ['account'],
  }
);
