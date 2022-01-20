import model from 'frappe/model';
import PurchaseOrder from '../PurchaseOrder/PurchaseOrder';

export default model.extend(PurchaseOrder, {
  name: 'PurchaseReceipt',
  label: 'Purchase Receipt',
  settings: 'PurchaseReceiptSettings',
  fields: [
    {
      fieldname: 'items',
      childtype: 'PurchaseReceiptItem',
    },
  ],
});
