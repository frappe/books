import { cloneDeep } from 'lodash';
import PartyOriginal from './Party';

const gstTypes = ['Unregistered', 'Registered Regular', 'Consumer'];

export default function getAugmentedParty({ country }) {
  const Party = cloneDeep(PartyOriginal);
  if (!country) {
    return Party;
  }

  if (country === 'India') {
    Party.fields.splice(
      3,
      0,
      {
        fieldname: 'gstin',
        label: 'GSTIN No.',
        fieldtype: 'Data',
        hidden: (doc) => (doc.gstType === 'Registered Regular' ? 0 : 1),
      },
      {
        fieldname: 'gstType',
        label: 'GST Registration',
        placeholder: 'GST Registration',
        fieldtype: 'Select',
        default: gstTypes[0],
        options: gstTypes,
      }
    );
    Party.quickEditFields.push('gstType');
    Party.quickEditFields.push('gstin');
  } else {
    Party.fields.splice(3, 0, {
      fieldname: 'taxId',
      label: 'Tax ID',
      fieldtype: 'Data',
    });
    Party.quickEditFields.push('taxId');
  }
  return Party;
}
