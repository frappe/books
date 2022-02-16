import { t } from 'frappe';
import model from 'frappe/model';
import PurchaseOrderSettings from '../PurchaseOrderSettings/PurchaseOrderSettings';

export default model.extend(PurchaseOrderSettings, {
  name: 'PurchaseReceiptSettings',
  label: t`Purchase Receipt Settings`,
  fields: [
    {
      fieldname: 'numberSeries',
      default: 'PREC',
    },
  ],
});
