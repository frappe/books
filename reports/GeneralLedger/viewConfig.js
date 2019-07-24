let title = 'General Ledger';

const viewConfig = {
  title,
  filterFields: [
    {
      fieldtype: 'Select',
      options: ['', 'Invoice', 'Payment', 'Bill'],
      label: 'Reference Type',
      fieldname: 'referenceType'
    },
    {
      fieldtype: 'DynamicLink',
      references: 'referenceType',
      label: 'Reference Name',
      fieldname: 'referenceName'
    },
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
  method: 'general-ledger',
  linkFields: [
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
    },
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async report => {
        await report.$router.push(`/report/general-ledger`);
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
