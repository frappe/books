const title = 'Bank Reconciliation';
module.exports = {
  title: title,
  method: 'bank-reconciliation',
  filterFields: [
    {
      fieldtype: 'Link',
      target: 'Account',
      label: 'Account',
      fieldname: 'account'
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      label: 'Party',
      fieldname: 'party'
    },
    {
      fieldtype: 'Date',
      label: 'From Date',
      fieldname: 'fromDate'
    },
    {
      fieldtype: 'Date',
      label: 'To Date',
      fieldname: 'toDate'
    }
  ],
  getColumns() {
    return [{
        label: 'Date',
        fieldtype: 'Date'
      },
      {
        label: 'Account',
        fieldtype: 'Link'
      },
      {
        label: 'Payment Account',
        fieldtype: 'Link'
      },
      {
        label: 'Debit',
        fieldtype: 'Currency'
      },
      {
        label: 'Credit',
        fieldtype: 'Currency'
      },
      {
        label: 'Balance',
        fieldtype: 'Currency'
      },
      {
        label: 'Reference Type',
        fieldtype: 'Data'
      },
      {
        label: 'Reference Name',
        fieldtype: 'Data'
      },
      {
        label: 'Party',
        fieldtype: 'Link'
      }
    ];
  }
};
