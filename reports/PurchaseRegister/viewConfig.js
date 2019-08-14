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
      size: 'small',
      placeholder: 'Supplier Name',
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
      size: 'small',
      placeholder: 'From Date',
      label: 'From Date',
      required: 1
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'To Date',
      fieldname: 'toDate',
      label: 'To Date',
      required: 1
    }
  ],
  linkFields: [
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async report => {
        await report.getReportData({});
        report.usedToReRender += 1;
      }
    }
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
