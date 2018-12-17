const title = 'Goods and Service Tax';
module.exports = {
  title: title,
  method: 'gst-taxes',
  filterFields: [{
    fieldtype: 'Data',
    label: 'Name',
    fieldname: 'name'
  },
  {
    fieldtype: 'Float',
    label: 'Rate',
    fieldname: 'rate'
  }],
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