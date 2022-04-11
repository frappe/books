import { t } from 'frappe';
import { cloneDeep } from 'lodash';
import PurchaseInvoiceItemOriginal from './PurchaseInvoiceItem';

export default function getAugmentedPurchaseInvoiceItem({ country }) {
  const PurchaseInvoiceItem = cloneDeep(PurchaseInvoiceItemOriginal);
  if (!country) {
    return PurchaseInvoiceItem;
  }

  if (country === 'India') {
    PurchaseInvoiceItem.fields = [
      ...PurchaseInvoiceItem.fields,
      {
        fieldname: 'hsnCode',
        label: t`HSN/SAC`,
        fieldtype: 'Int',
        formula: (row, doc) => doc.getFrom('Item', row.item, 'hsnCode'),
        formulaDependsOn: ['item'],
      },
    ];
  }

  return PurchaseInvoiceItem;
}
