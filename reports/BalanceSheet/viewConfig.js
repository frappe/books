module.exports = {
  title: 'Balance Sheet',
  method: 'balance-sheet',
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'toDate',
      size: 'small',
      placeholder: 'ToDate',
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
      fieldname: 'periodicity',
      default: 'Monthly'
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
