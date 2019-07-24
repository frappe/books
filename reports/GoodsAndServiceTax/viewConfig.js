const title = 'Goods and Service Tax';
module.exports = {
  title: title,
  method: 'gst-taxes',
  filterFields: [
    {
      fieldtype: 'Select',
      label: 'Report Type',
      fieldname: 'reportType',
      options: ['', 'GSTR-1', 'GSTR-2', 'GSTR-3B']
    },
    {
      fieldtype: 'Data',
      label: 'Transfer Type',
      fieldname: 'transferType'
    },
    {
      fieldtype: 'Data',
      label: 'Place',
      fieldname: 'place'
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
    }
  ],

  getColumns() {
    return [
      {
        label: 'GSTIN No.',
        fieldname: 'gstin',
        fieldtype: 'Data',
        width: 100
      },
      {
        fieldtype: 'Data',
        fieldname: 'partyName',
        label: 'Party',
        width: 100
      },
      {
        label: 'Invoice No.',
        fieldname: 'invNo',
        fieldtype: 'Data',
        width: 100
      },
      {
        label: 'Invoice Value',
        fieldname: 'invAmt',
        fieldtype: 'Currency',
        width: 100
      },
      {
        label: 'Invoice Date',
        fieldname: 'invDate',
        fieldtype: 'Date',
        width: 100
      },
      {
        label: 'Place of supply',
        fieldname: 'place',
        fieldtype: 'Data',
        width: 100
      },
      {
        label: 'Rate',
        fieldname: 'rate',
        fieldtype: 'Data',
        width: 80
      },
      {
        label: 'Taxable Amount',
        fieldname: 'taxAmt',
        fieldtype: 'Currency',
        width: 100
      },
      {
        label: 'Intergrated Tax',
        fieldname: 'igstAmt',
        fieldtype: 'Currency',
        width: 100
      },
      {
        label: 'Central Tax',
        fieldname: 'cgstAmt',
        fieldtype: 'Currency',
        width: 100
      },
      {
        label: 'State Tax',
        fieldname: 'sgstAmt',
        fieldtype: 'Currency',
        width: 100
      }
    ];
  }
};
