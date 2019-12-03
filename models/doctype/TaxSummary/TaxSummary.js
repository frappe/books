module.exports = {
  name: 'TaxSummary',
  doctype: 'DocType',
  isChild: 1,
  fields: [
    {
      fieldname: 'account',
      label: 'Tax Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1
    },
    {
      fieldname: 'rate',
      label: 'Rate',
      fieldtype: 'Float',
      required: 1
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      required: 1
    },
    {
      fieldname: 'baseAmount',
      label: 'Amount (Company Currency)',
      fieldtype: 'Currency',
      formula: (row, doc) => row.amount * doc.exchangeRate,
      readOnly: 1
    }
  ]
};
