const title = 'Profit and Loss';
module.exports = {
  title: title,
  method: 'profit-and-loss',
  filterFields: [
    { fieldtype: 'Date', fieldname: 'fromDate', label: 'From Date', required: 1 },
    { fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1 },
    {
      fieldtype: 'Select', options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
      label: 'Periodicity', fieldname: 'periodicity', default: 'Monthly'
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
