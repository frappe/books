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
        fieldtype: 'Date'
      },
      {
        label: 'Account',
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
      },
      {
        label: 'Description',
        fieldtype: 'Data'
      }
    ];
  }
};

module.exports = viewConfig;
