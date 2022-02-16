import { t } from 'frappe';

export default {
  name: 'Currency',
  label: t`Currency`,
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: ['name', 'symbol'],
  quickEditFields: ['name', 'symbol'],
  fields: [
    {
      fieldname: 'name',
      label: t`Currency Name`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'fraction',
      label: t`Fraction`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'fractionUnits',
      label: t`Fraction Units`,
      fieldtype: 'Int',
    },
    {
      label: t`Smallest Currency Fraction Value`,
      fieldname: 'smallestValue',
      fieldtype: 'Currency',
    },
    {
      label: t`Symbol`,
      fieldname: 'symbol',
      fieldtype: 'Data',
    },
  ],
};
