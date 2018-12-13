const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');

module.exports = class BankReconciliationView extends ReportPage {
  constructor() {
    super({
      title: frappe._('Bank Reconciliation'),
      filterFields: [
        {
          fieldtype: 'Link',
          target: 'Account',
          label: 'Account'
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
