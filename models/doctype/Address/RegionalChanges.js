import { cloneDeep, capitalize } from 'lodash';
import AddressOriginal from './Address';
import { stateCodeMap } from '../../../accounting/gst';

export default function getAugmentedAddress({ country }) {
  const Address = cloneDeep(AddressOriginal);
  if (!country) {
    return Address;
  }

  if (country === 'India') {
    Address.fields = [
      ...Address.fields,
      {
        fieldname: 'pos',
        label: 'Place of Supply',
        fieldtype: 'Select',
        placeholder: 'Place of Supply',
        options: Object.keys(stateCodeMap).map((key) => capitalize(key)),
      },
    ];
    
    Address.quickEditFields = [
      ...Address.quickEditFields,
      'pos',
    ];
  }

  return Address;
}