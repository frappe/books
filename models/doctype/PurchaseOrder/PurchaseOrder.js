import model from 'frappejs/model';
import PurchaseInvoice from '../PurchaseInvoice/PurchaseInvoice';

export default model.extend(
  PurchaseInvoice,
  {
    name: 'PurchaseOrder',
    label: 'Purchase Order',
    settings: 'PurchaseOrderSettings',
    fields: [
      {
        fieldname: 'items',
        childtype: 'PurchaseOrderItem'
      }
    ]
  },
  {
    skipFields: ['account']
  }
);
