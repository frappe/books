export default {
  name: 'Currency',
  label: 'Currency',
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: ['name', 'symbol'],
  quickEditFields: ['name', 'symbol'],
  fields: [
    {
      fieldname: 'name',
      label: 'Currency Name',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'fraction',
      label: 'Fraction',
      fieldtype: 'Data'
    },
    {
      fieldname: 'fractionUnits',
      label: 'Fraction Units',
      fieldtype: 'Int'
    },
    {
      label: 'Smallest Currency Fraction Value',
      fieldname: 'smallestValue',
      fieldtype: 'Currency'
    },
    {
      label: 'Symbol',
      fieldname: 'symbol',
      fieldtype: 'Data'
    },
    {
      fieldname: 'numberFormat',
      fieldtype: 'Select',
      label: 'Number Format',
      options: [
        '',
        '#,###.##',
        '#.###,##',
        '# ###.##',
        '# ###,##',
        "#'###.##",
        '#, ###.##',
        '#,##,###.##',
        '#,###.###',
        '#.###',
        '#,###'
      ]
    }
  ]
};
