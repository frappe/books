const title = 'Trial Balance';
module.exports = {
  title: title,
  method: 'trial-balance',
  filterFields: [
    { fieldtype: 'Date', fieldname: 'fromDate', label: 'From Date', required: 1 },
    { fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1 }
  ],
  getColumns(data) {
    const columns = [
      { label: 'Account', fieldtype: 'Data', fieldname: 'account', width: 340 },
      { label: 'Opening (Dr)', fieldtype: 'Currency', fieldname: 'openingDebit' },
      { label: 'Opening (Cr)', fieldtype: 'Currency', fieldname: 'openingCredit' },
      { label: 'Debit', fieldtype: 'Currency', fieldname: 'debit' },
      { label: 'Credit', fieldtype: 'Currency', fieldname: 'credit' },
      { label: 'Closing (Dr)', fieldtype: 'Currency', fieldname: 'closingDebit' },
      { label: 'Closing (Cr)', fieldtype: 'Currency', fieldname: 'closingCredit' }
    ];

    return columns;
  }
};
