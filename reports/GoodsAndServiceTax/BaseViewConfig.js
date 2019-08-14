module.exports = {
  filterFields: [
    {
      fieldtype: 'Select',
      label: 'Transfer Type',
      fieldname: 'transferType',
      options: [
        '',
        'B2B',
        'B2C-Large',
        'B2C-Small',
        'Nil Rated, Exempted and Non GST supplies'
      ],
      size: 'small'
    },
    {
      fieldtype: 'Data',
      label: 'Place',
      size: 'small',
      placeholder: 'Place',
      fieldname: 'place'
    },
    {
      fieldtype: 'Date',
      label: 'From Date',
      size: 'small',
      placeholder: 'From Date',
      fieldname: 'fromDate'
    },
    {
      fieldtype: 'Date',
      label: 'To Date',
      size: 'small',
      placeholder: 'To Date',
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
        label: 'Taxable Value',
        fieldname: 'taxVal',
        fieldtype: 'Currency',
        width: 100
      },
      {
        label: 'Reverse Chrg.',
        fieldname: 'reverseCharge',
        fieldtype: 'Data',
        width: 80
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
