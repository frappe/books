const title = 'Profit and Loss';
module.exports = {
  title: title,
  method: 'profit-and-loss',
  treeView: true,
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      size: 'small',
      placeholder: 'From Date',
      label: 'From Date',
      required: 1
    },
    {
      fieldtype: 'Date',
      fieldname: 'toDate',
      size: 'small',
      placeholder: 'To Date',
      label: 'To Date',
      required: 1
    },
    {
      fieldtype: 'Select',
      size: 'small',
      options: [
        'Select Period...',
        'Monthly',
        'Quarterly',
        'Half Yearly',
        'Yearly'
      ],
      label: 'Periodicity',
      fieldname: 'periodicity'
    }
  ],
  getColumns(data) {
    const columns = [
      { label: 'Account', fieldtype: 'Data', fieldname: 'account', width: 340 }
    ];

    if (data && data.columns) {
      const currencyColumns = data.columns;
      const columnDefs = currencyColumns.map(name => ({
        label: name,
        fieldname: name,
        fieldtype: 'Currency'
      }));

      columns.push(...columnDefs);
    }

    return columns;
  }
};
