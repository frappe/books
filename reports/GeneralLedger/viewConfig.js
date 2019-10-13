let title = 'General Ledger';

const viewConfig = {
  title,
  filterFields: [
    {
      fieldtype: 'Select',
      options: ['Select...', 'SalesInvoice', 'Payment', 'PurchaseInvoice'],
      size: 'small',
      label: 'Reference Type',
      fieldname: 'referenceType'
    },
    {
      fieldtype: 'DynamicLink',
      size: 'small',
      placeholder: 'Reference Name',
      references: 'referenceType',
      label: 'Reference Name',
      fieldname: 'referenceName'
    },
    {
      fieldtype: 'Link',
      target: 'Account',
      size: 'small',
      placeholder: 'Account',
      label: 'Account',
      fieldname: 'account'
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      label: 'Party',
      size: 'small',
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
  method: 'general-ledger',
  linkFields: [
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async report => {
        await report.getReportData({});
        report.usedToReRender += 1;
      }
    },
    {
      label: 'Export',
      type: 'primary',
      action: async report => {
        async function getReportDetails() {
          let [rows, columns] = await report.getReportData(
            report.currentFilters
          );
          let columnData = columns.map(column => {
            return {
              id: column.id,
              content: column.content,
              checked: true
            };
          });
          return {
            title: title,
            rows: rows,
            columnData: columnData
          };
        }
        report.$modal.show({
          modalProps: {
            title: `Export ${title}`,
            noFooter: true
          },
          component: require('../../src/components/ExportWizard').default,
          props: await getReportDetails()
        });
      }
    }
  ],
  getColumns() {
    return [
      {
        label: 'Date',
        fieldtype: 'Date',
        fieldname: 'date'
      },
      {
        label: 'Account',
        fieldtype: 'Link',
        fieldname: 'account'
      },
      {
        label: 'Debit',
        fieldtype: 'Currency',
        fieldname: 'debit'
      },
      {
        label: 'Credit',
        fieldtype: 'Currency',
        fieldname: 'credit'
      },
      {
        label: 'Balance',
        fieldtype: 'Currency',
        fieldname: 'balance'
      },
      {
        label: 'Reference Type',
        fieldtype: 'Data',
        fieldname: 'referenceType'
      },
      {
        label: 'Reference Name',
        fieldtype: 'Data',
        fieldname: 'referenceName'
      },
      {
        label: 'Party',
        fieldtype: 'Link',
        fieldname: 'party'
      },
      {
        label: 'Description',
        fieldtype: 'Data',
        fieldname: 'description'
      }
    ];
  }
};

module.exports = viewConfig;
