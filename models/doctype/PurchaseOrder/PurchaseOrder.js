import { t } from 'frappe';
import model from 'frappe/model';
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
    ],
  },
  {
    skipFields: ['account'],
  }
);
