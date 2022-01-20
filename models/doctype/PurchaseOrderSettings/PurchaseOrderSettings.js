import model from 'frappe/model';
import PurchaseInvoiceSettings from '../PurchaseInvoiceSettings/PurchaseInvoiceSettings';

export default model.extend(PurchaseInvoiceSettings, {
  name: 'PurchaseOrderSettings',
  label: 'Purchase Order Settings',
  fields: [
    {
      fieldname: 'numberSeries',
      default: 'PO',
    },
  ],
});
