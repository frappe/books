const title = 'Purchase Register';
module.exports = {
  title: title,
  method: 'purchase-register',
  filterFields: [
    {
      fieldtype: 'Link',
      target: 'Party',
      label: 'Supplier Name',
      fieldname: 'supplier',
      getFilters: query => {
        if (query)
          return {
            keywords: ['like', query],
            supplier: 1
          };

        return {
          supplier: 1
        };
      }
    },
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      label: 'From Date',
      required: 1
    },
    { fieldtype: 'Date', fieldname: 'toDate', label: 'To Date', required: 1 }
  ],
  getColumns() {
    return [
      { label: 'PurchaseInvoice', fieldname: 'name' },
      { label: 'Posting Date', fieldname: 'date' },
      { label: 'Supplier', fieldname: 'supplier' },
      { label: 'Payable Account', fieldname: 'account' },
      { label: 'Net Total', fieldname: 'netTotal', fieldtype: 'Currency' },
      { label: 'Total Tax', fieldname: 'totalTax', fieldtype: 'Currency' },
      { label: 'Grand Total', fieldname: 'grandTotal', fieldtype: 'Currency' }
    ];
  }
};
