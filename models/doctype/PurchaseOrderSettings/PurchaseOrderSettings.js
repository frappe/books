import { t } from 'frappe';
import model from 'frappe/model';
import PurchaseInvoiceSettings from '../PurchaseInvoiceSettings/PurchaseInvoiceSettings';

export default model.extend(PurchaseInvoiceSettings, {
  name: 'PurchaseOrderSettings',
  label: t`Purchase Order Settings`,
  fields: [],
});
