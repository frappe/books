const title = 'General Ledger';
module.exports = {
  title: title,
  method: 'general-ledger',
  filterFields: [
    {
      fieldtype: 'Select',
      options: ['', 'Invoice', 'Payment'],
      label: 'Reference Type',
      fieldname: 'referenceType'
    },
    {
      fieldtype: 'DynamicLink',
      references: 'referenceType',
      label: 'Reference Name',
      fieldname: 'referenceName'
    },
    { fieldtype: 'Link', target: 'Account', label: 'Account', fieldname: 'account' },
    { fieldtype: 'Link', target: 'Party', label: 'Party', fieldname: 'party' },
    { fieldtype: 'Date', label: 'From Date', fieldname: 'fromDate' },
    { fieldtype: 'Date', label: 'To Date', fieldname: 'toDate' }
  ],
  getColumns() {
    return [
      { label: 'Date', fieldtype: 'Date' },
      { label: 'Account', fieldtype: 'Link' },
      { label: 'Debit', fieldtype: 'Currency' },
      { label: 'Credit', fieldtype: 'Currency' },
      { label: 'Balance', fieldtype: 'Currency' },
      { label: 'Reference Type', fieldtype: 'Data' },
      { label: 'Reference Name', fieldtype: 'Data' },
      { label: 'Party', fieldtype: 'Link' },
      { label: 'Description', fieldtype: 'Data' }
    ];
  }
};
