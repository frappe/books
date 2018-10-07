const title = 'Sales Register';
module.exports = {
  title: title,
  method: 'sales-register',
  filterFields: [
    { fieldtype: 'Link', target: 'Party', label: 'Customer Name', fieldname: 'customer' },
    { fieldtype: 'Date', fieldname: 'fromDate', label: 'From Date', required: 1 },
    { fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1 }
  ],
  getColumns() {
    return [
      { label: 'Invoice', fieldname: 'name' },
      { label: 'Posting Date', fieldname: 'date' , fieldtype: 'Date' },
      { label: 'Customer', fieldname: 'customer' },
      { label: 'Receivable Account', fieldname: 'account' },
      { label: 'Net Total', fieldname: 'netTotal', fieldtype: 'Currency' },
      { label: 'Total Tax', fieldname: 'totalTax', fieldtype: 'Currency' },
      { label: 'Grand Total', fieldname: 'grandTotal', fieldtype: 'Currency' },
    ];
  }
};
