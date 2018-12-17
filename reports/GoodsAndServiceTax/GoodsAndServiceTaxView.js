const ReportPage = require('frappejs/client/desk/reportpage');
const frappe = require('frappejs');

module.exports = class GoodsAndServiceTaxView extends ReportPage {
  constructor() {
    super({
      title: frappe._('Goods and Service Tax'),
      filterFields: [
        {
          fieldtype: 'Data',
          label: 'Name'
        },
        {
          fieldtype: 'Float',
          label: 'Rate'
        }
      ]
    });

    this.method = 'gst-taxes';
  }

  getColumns() {
    return [{
      label: 'GSTIN No.',
      fieldname: 'gstin',
      fieldtype: 'Data'
    },
    {
      fieldtype: 'Data',
      fieldname: 'cusName',
      label: 'Customer Name'
    },
    {
      label: 'Invoice No.',
      fieldname: 'invNo',
      fieldtype: 'Data'
    },
    {
      label: 'Invoice Value',
      fieldname: 'invAmt',
      fieldtype: 'Data'
    },
    {
      label: 'Invoice Date',
      fieldname: 'invDate',
      fieldtype: 'Date'
    },
    {
      label: 'Place of supply',
      fieldname: 'place',
      fieldtype: 'Data'
    },
    {
      label: 'Rate',
      fieldname: 'rate',
      fieldtype: 'Data'
    },
    {
      label: 'Taxable Amount',
      fieldname: 'taxAmt',
      fieldtype: 'Data'
    }
    ];
  }
};
