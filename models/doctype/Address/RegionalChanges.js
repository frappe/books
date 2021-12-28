import { cloneDeep, capitalize } from 'lodash';
import AddressOriginal from './Address';
import { stateCodeMap } from '../../../accounting/gst';

export default function getAugmentedAddress({ country }) {
  const Address = cloneDeep(AddressOriginal);
  if (!country) {
    return Address;
  }

  const cityFieldIndex = Address.fields.findIndex(
    (i) => i.fieldname === 'city'
  );
  if (country === 'India') {
    Address.fields = [
      ...Address.fields.slice(0, cityFieldIndex + 1),
      {
        fieldname: 'state',
        label: 'State / UT',
        fieldtype: 'Select',
        placeholder: 'State / UT',
        options: Object.keys(stateCodeMap).map((key) => capitalize(key)),
      },
      ...Address.fields.slice(cityFieldIndex + 1, Address.fields.length),
    ];
    // Setting country as India for customers as default for SMBs in India
    Address.fields.forEach((field) => {
      if (field.fieldname === 'country') {
        field.default = 'India';
      }
    });
  } else {
    Address.fields = [
      ...Address.fields.slice(0, cityFieldIndex + 1),
      {
        fieldname: 'state',
        label: 'State',
        placeholder: 'State',
        fieldtype: 'Data',
      },
      ...Address.fields.slice(cityFieldIndex + 1, Address.fields.length),
    ];
  }

  Address.quickEditFields = [
    ...Address.quickEditFields.slice(0, cityFieldIndex + 1),
    'state',
    ...Address.quickEditFields.slice(cityFieldIndex + 1, Address.fields.length),
  ];

  return Address;
}