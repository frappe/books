import { cloneDeep } from 'lodash';
import FulfillmentItemOriginal from './FulfillmentItem';

export default function getAugmentedFulfillmentItem({ country }) {
  const FulfillmentItem = cloneDeep(FulfillmentItemOriginal);
  if (!country) {
    return FulfillmentItem;
  }

  if (country === 'India') {
    FulfillmentItem.fields = [
      ...FulfillmentItem.fields,
      {
        fieldname: 'hsnCode',
        label: 'HSN/SAC',
        fieldtype: 'Int',
        formula: (row, doc) => doc.getFrom('Item', row.item, 'hsnCode'),
        formulaDependsOn: ['item'],
      },
    ];
  }

  return FulfillmentItem;
}
