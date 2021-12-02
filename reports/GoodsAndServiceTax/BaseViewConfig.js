import ExportWizard from '../../src/components/ExportWizard';

export default {
  filterFields: [
    {
      fieldtype: 'Select',
      label: 'Transfer Type',
      placeholder: 'Transfer Type',
      fieldname: 'transferType',
      options: [
        '',
        'B2B',
        'B2C-Large',
        'B2C-Small',
        'Nil Rated, Exempted and Non GST supplies',
      ],
      size: 'small',
    },
    {
      fieldtype: 'Data',
      label: 'Place',
      size: 'small',
      placeholder: 'Place',
      fieldname: 'place',
    },
    {
      fieldtype: 'Date',
      label: 'From Date',
      size: 'small',
      placeholder: 'From Date',
      fieldname: 'fromDate',
    },
    {
      fieldtype: 'Date',
      label: 'To Date',
      size: 'small',
      placeholder: 'To Date',
      fieldname: 'toDate',
    },
  ],
  linkFields: [
    {
      label: 'Export',
      type: 'primary',
      action: async (report) => {
        async function getReportDetails() {
          let [rows, columns] = await report.getReportData(
            report.currentFilters
          );
          let columnData = columns.map((column) => {
            return {
              id: column.id,
              content: column.content,
              checked: true,
            };
          });
          return {
            title: title,
            rows: rows,
            columnData: columnData,
          };
        }
        report.$modal.show({
          modalProps: {
            title: `Export ${title}`,
            noFooter: true,
          },
          component: ExportWizard,
          props: await getReportDetails(),
        });
      },
    },
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async (report) => {
        await report.getReportData({});
        report.usedToReRender += 1;
      },
    },
  ],

  getColumns() {
    return [
      {
        label: 'GSTIN No.',
        fieldname: 'gstin',
        fieldtype: 'Data',
        width: 1.5,
      },
      {
        label: 'Party',
        fieldtype: 'Data',
        fieldname: 'partyName',
        width: 1.5,
      },
      {
        label: 'Invoice No.',
        fieldname: 'invNo',
        fieldtype: 'Data',
      },
      {
        label: 'Invoice Value',
        fieldname: 'invAmt',
        fieldtype: 'Currency',
      },
      {
        label: 'Invoice Date',
        fieldname: 'invDate',
        fieldtype: 'Date',
      },
      {
        label: 'Place of supply',
        fieldname: 'place',
        fieldtype: 'Data',
      },
      {
        label: 'Rate',
        fieldname: 'rate',
        fieldtype: 'Data',
        width: 0.5,
      },
      {
        label: 'Taxable Value',
        fieldname: 'taxVal',
        fieldtype: 'Currency',
      },
      {
        label: 'Reverse Chrg.',
        fieldname: 'reverseCharge',
        fieldtype: 'Data',
      },
      {
        label: 'Intergrated Tax',
        fieldname: 'igstAmt',
        fieldtype: 'Currency',
      },
      {
        label: 'Central Tax',
        fieldname: 'cgstAmt',
        fieldtype: 'Currency',
      },
      {
        label: 'State Tax',
        fieldname: 'sgstAmt',
        fieldtype: 'Currency',
      },
    ];
  },
};
