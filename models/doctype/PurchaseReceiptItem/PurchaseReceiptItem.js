import { t } from 'frappe';
import model from 'frappe/model';
import PurchaseOrderItem from '../PurchaseOrderItem/PurchaseOrderItem';

export default model.extend(
  PurchaseOrderItem,
  {
    name: 'PurchaseReceiptItem',
    fields: [
      {
        fieldname: 'acceptedQuantity',
        label: t`Accepted Quantity`,
        fieldtype: 'Float',
        required: 1,
      },
    ],
  },
  {
    skipFields: ['expenseAccount'],
  }
);
