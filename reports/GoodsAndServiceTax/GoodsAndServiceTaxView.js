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
      label: 'Name',
      fieldtype: 'Data'
    },
    {
      fieldtype: 'Float',
      label: 'Rate'
    }
    ];
  }
};
