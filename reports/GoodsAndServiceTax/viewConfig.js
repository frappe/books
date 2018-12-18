const title = 'Goods and Service Tax';
module.exports = {
  title: title,
  method: 'gst-taxes',
  filterFields: [{
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