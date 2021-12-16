import { cloneDeep } from 'lodash';
import SalesOrderItemOriginal from './SalesOrderItem';

export default function getAugmentedSalesOrderItem({ country }) {
  const SalesOrderItem = cloneDeep(SalesOrderItemOriginal);
  if (!country) {
    return SalesOrderItem;
  }

  if (country === 'India') {
    SalesOrderItem.fields = [
      ...SalesOrderItem.fields,
      {
        fieldname: 'hsnCode',
        label: 'HSN/SAC',
        fieldtype: 'Int',
        formula: (row, doc) => doc.getFrom('Item', row.item, 'hsnCode'),
        formulaDependsOn: ['item'],
      },
    ];
  }

  return SalesOrderItem;
}
