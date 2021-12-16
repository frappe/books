import { cloneDeep } from 'lodash';
import QuotationItemOriginal from './QuotationItem';

export default function getAugmentedQuotationItem({ country }) {
  const QuotationItem = cloneDeep(QuotationItemOriginal);
  if (!country) {
    return QuotationItem;
  }

  if (country === 'India') {
    QuotationItem.fields = [
      ...QuotationItem.fields,
      {
        fieldname: 'hsnCode',
        label: 'HSN/SAC',
        fieldtype: 'Int',
        formula: (row, doc) => doc.getFrom('Item', row.item, 'hsnCode'),
        formulaDependsOn: ['item'],
      },
    ];
  }

  return QuotationItem;
}
