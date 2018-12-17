const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');

module.exports = class BankReconciliationView extends ReportPage {
  constructor() {
    super({
      title: frappe._('Bank Reconciliation'),
      filterFields: [{
          fieldtype: 'Link',
          target: 'Account',
          label: 'Payment Account'
        },
        {
          fieldtype: 'Link',
          target: 'Party',
          label: 'Party'
        },
        {
          fieldtype: 'Date',
          label: 'From Date'
        },
        {
          fieldtype: 'Date',
          label: 'To Date'
        }
      ]
    });

    this.method = 'bank-reconciliation';
  }

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
        label: 'Party',
        fieldtype: 'Link'
      }
    ];
  }
};
