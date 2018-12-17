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
        label: 'Name',
        fieldtype: 'Data'
      },
      {
        fieldtype: 'Float',
        label: 'Rate',
      }
    ];
  }
};