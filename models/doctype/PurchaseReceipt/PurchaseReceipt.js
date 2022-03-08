import { t } from 'frappe';
import model from 'frappe/model';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';
import PurchaseOrder from '../PurchaseOrder/PurchaseOrder';

export default model.extend(PurchaseOrder, {
  name: 'PurchaseReceipt',
  label: t`Purchase Receipt`,
  settings: 'PurchaseReceiptSettings',
  fields: [
    {
      fieldname: 'items',
      childtype: 'PurchaseReceiptItem',
    },
    {
      fieldname: 'numberSeries',
      label: t`Number Series`,
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      getFilters: () => {
        return { referenceType: 'PurchaseReceipt' };
      },
      default: DEFAULT_NUMBER_SERIES['PurchaseReceipt'],
    },
  ],
});
