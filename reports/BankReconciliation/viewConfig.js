const title = 'Bank Reconciliation';
module.exports = {
  title: title,
  method: 'bank-reconciliation',
  filterFields: [{
      fieldtype: 'Link',
      target: 'Account',
      label: 'Payement Account',
      fieldname: 'paymentAccount'
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
        label: 'Posting Date',
        fieldtype: 'Date',
        fieldname: 'date'
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
        label: 'Ref. Type',
        fieldtype: 'Data',
        fieldname: 'referenceType'
      },
      {
        label: 'Ref. Name',
        fieldtype: 'Data',
        fieldname: 'referenceName'
      },
      {
        label: 'Ref. Date',
        fieldtype: 'Date',
        fieldname: 'referenceDate'
      },
      {
        label: 'Clearance Date',
        fieldtype: 'Date',
        fieldname: 'clearanceDate'
      },
      {
        label: 'Party',
        fieldtype: 'Link'
      }
    ];
  }
};
