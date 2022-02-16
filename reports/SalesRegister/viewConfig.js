const title = 'Sales Register';
import { t } from 'frappe';

export default {
  title: title,
  method: 'sales-register',
  filterFields: [
    {
      fieldtype: 'Link',
      target: 'Party',
      label: t`Customer Name`,
      size: 'small',
      placeholder: 'Customer Name',
      fieldname: 'customer',
      getFilters: (query) => {
        if (query)
          return {
            keywords: ['like', query],
            customer: 1,
          };

        return {
          customer: 1,
        };
      },
    },
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      size: 'small',
      placeholder: 'From Date',
      label: t`From Date`,
      required: 1,
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'To Date',
      fieldname: 'toDate',
      label: t`To Date`,
      required: 1,
    },
  ],
  actions: [],
  getColumns() {
    return [
      { label: t`SalesInvoice`, fieldname: 'name' },
      { label: t`Posting Date`, fieldname: 'date', fieldtype: 'Date' },
      { label: t`Customer`, fieldname: 'customer' },
      { label: t`Receivable Account`, fieldname: 'account' },
      { label: t`Net Total`, fieldname: 'netTotal', fieldtype: 'Currency' },
      { label: t`Total Tax`, fieldname: 'totalTax', fieldtype: 'Currency' },
      { label: t`Grand Total`, fieldname: 'grandTotal', fieldtype: 'Currency' },
    ];
  },
};
