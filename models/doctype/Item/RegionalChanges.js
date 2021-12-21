import { cloneDeep } from 'lodash';
import ItemOriginal from './Item';

export default function getAugmentedItem({ country }) {
  const Item = cloneDeep(ItemOriginal);
  if (!country) {
    return Item;
  }

  if (country === 'India') {
    const nameFieldIndex = Item.fields.findIndex(i => i.fieldname === 'name');

    Item.fields = [
      ...Item.fields.slice(0, nameFieldIndex + 1),
      {
        fieldname: 'hsnCode',
        label: 'HSN/SAC',
        fieldtype: 'Int',
        placeholder: 'HSN/SAC Code',
      },
      ...Item.fields.slice(nameFieldIndex + 1, Item.fields.length),
    ];

    Item.quickEditFields.unshift('hsnCode');
  }

  return Item;
}
