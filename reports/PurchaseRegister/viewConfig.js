const title = 'Purchase Register';
import { t } from 'fyo';

export default {
  title: title,
  method: 'purchase-register',
  filterFields: [
    {
      fieldtype: 'Link',
      target: 'Party',
      label: t`Supplier Name`,
      fieldname: 'supplier',
      size: 'small',
      placeholder: t`Supplier Name`,
      getFilters: (query) => {
        if (query)
          return {
            keywords: ['like', query],
            supplier: 1,
          };

        return {
          supplier: 1,
        };
      },
    },
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      size: 'small',
      placeholder: t`From Date`,
      label: t`From Date`,
      required: 1,
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: t`To Date`,
      fieldname: 'toDate',
      label: t`To Date`,
      required: 1,
    },
  ],
  actions: [],
  getColumns() {
    return [
      { label: t`PurchaseInvoice`, fieldname: 'name' },
      { label: t`Posting Date`, fieldname: 'date' },
      { label: t`Supplier`, fieldname: 'supplier' },
      { label: t`Payable Account`, fieldname: 'account' },
      { label: t`Net Total`, fieldname: 'netTotal', fieldtype: 'Currency' },
      { label: t`Total Tax`, fieldname: 'totalTax', fieldtype: 'Currency' },
      { label: t`Grand Total`, fieldname: 'grandTotal', fieldtype: 'Currency' },
    ];
  },
};
