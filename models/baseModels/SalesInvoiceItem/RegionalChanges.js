import { t } from 'frappe';
import { cloneDeep } from 'lodash';
import SalesInvoiceItemOriginal from './SalesInvoiceItem';

export default function getAugmentedSalesInvoiceItem({ country }) {
  const SalesInvoiceItem = cloneDeep(SalesInvoiceItemOriginal);
  if (!country) {
    return SalesInvoiceItem;
  }

  if (country === 'India') {
    SalesInvoiceItem.fields = [
      ...SalesInvoiceItem.fields,
      {
        fieldname: 'hsnCode',
        label: t`HSN/SAC`,
        fieldtype: 'Int',
        formula: (row, doc) => doc.getFrom('Item', row.item, 'hsnCode'),
        formulaDependsOn: ['item'],
      },
    ];
  }

  return SalesInvoiceItem;
}
