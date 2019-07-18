let title = 'General Ledger';
let filterFields = [
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
];

const viewConfig = {
  title,
  filterFields,
  method: 'general-ledger',
  linkFields: [
    {
      label: 'Export',
      action: async report => {
        async function getReportDetails() {
          let [rows, columns] = await report.getReportData(filterFields);
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
