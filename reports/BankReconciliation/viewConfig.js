const title = 'Bank Reconciliation';
module.exports = {
  title: title,
  method: 'bank-reconciliation',
  filterFields: [
    {
      fieldtype: 'Link',
      target: 'Account',
      size: 'small',
      placeholder: 'Payment Account',
      label: 'Payment Account',
      fieldname: 'paymentAccount',
      getFilters: () => {
        return {
          accountType: 'Bank',
          isGroup: 0
        };
      }
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      size: 'small',
      label: 'Party',
      placeholder: 'Party',
      fieldname: 'party'
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'From Date',
      label: 'From Date',
      fieldname: 'fromDate'
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'To Date',
      label: 'To Date',
      fieldname: 'toDate'
    }
  ],
  linkFields: [
    {
      label: 'Reconcile',
      type: 'secondary',
      condition: report => report.currentFilters.paymentAccount,
      action: async report => {
        report.$modal.show({
          modalProps: {
            title: `Import Bank Account Statement`,
            noFooter: true
          },
          component: require('../../src/components/ImportWizard').default,
          props: {
            importHandler: require('./BankReconciliationImport')
              .fileImportHandler,
            report
          }
        });
      }
    },
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async report => {
        await report.getReportData({});
        report.usedToReRender += 1;
      }
    }
  ],
  getColumns() {
    return [
      {
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
        label: 'Ref/Cheque ID',
        fieldtype: 'Data',
        fieldname: 'referenceId'
      },
      {
        label: 'Clearance Date',
        fieldtype: 'Date',
        fieldname: 'clearanceDate'
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
