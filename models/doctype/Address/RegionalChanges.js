import { cloneDeep } from 'lodash';
import { stateCodeMap } from '../../../accounting/gst';
import { titleCase } from '../../../src/utils';
import AddressOriginal from './Address';

export default function getAugmentedAddress({ country }) {
  const Address = cloneDeep(AddressOriginal);
  if (!country) {
    return Address;
  }

  const stateList = Object.keys(stateCodeMap).map(titleCase).sort();
  if (country === 'India') {
    Address.fields = [
      ...Address.fields,
      {
        fieldname: 'pos',
        label: 'Place of Supply',
        fieldtype: 'AutoComplete',
        placeholder: 'Place of Supply',
        formula: (doc) => (stateList.includes(doc.state) ? doc.state : ''),
        getList: () => stateList,
      },
    ];

    Address.quickEditFields = [...Address.quickEditFields, 'pos'];
  }

  return Address;
}
