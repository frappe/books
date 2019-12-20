import { partyWithAvatar } from '@/utils';

let title = 'General Ledger';

const viewConfig = {
  title,
  filterFields: [
    {
      fieldtype: 'Select',
      options: [
        { label: '', value: '' },
        { label: 'Sales Invoice', value: 'SalesInvoice' },
        { label: 'Purchase Invoice', value: 'PurchaseInvoice' },
        { label: 'Payment', value: 'Payment' },
        { label: 'Journal Entry', value: 'JournalEntry' }
      ],
      size: 'small',
      label: 'Reference Type',
      fieldname: 'referenceType',
      placeholder: 'Reference Type'
    },
    {
      fieldtype: 'DynamicLink',
      size: 'small',
      placeholder: 'Reference Name',
      references: 'referenceType',
      label: 'Reference Name',
      fieldname: 'referenceName'
    },
    {
      fieldtype: 'Link',
      target: 'Account',
      size: 'small',
      placeholder: 'Account',
      label: 'Account',
      fieldname: 'account'
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      label: 'Party',
      size: 'small',
      placeholder: 'Party',
      fieldname: 'party'
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'From Date',
      label: 'From Date',
      fieldname: 'fromDate'
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'To Date',
      label: 'To Date',
      fieldname: 'toDate'
    }
  ],
  method: 'general-ledger',
  linkFields: [
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async report => {
        await report.getReportData({});
        report.usedToReRender += 1;
      }
    },
    {
      label: 'Export',
      type: 'primary',
      action: () => {}
    }
  ],
  getColumns() {
    return [
      {
        label: 'Account',
        fieldtype: 'Link',
        fieldname: 'account'
      },
      {
        label: 'Date',
        fieldtype: 'Date',
        fieldname: 'date'
      },
      {
        label: 'Debit',
        fieldtype: 'Currency',
        fieldname: 'debit',
        width: 0.5
      },
      {
        label: 'Credit',
        fieldtype: 'Currency',
        fieldname: 'credit',
        width: 0.5
      },
      {
        label: 'Balance',
        fieldtype: 'Currency',
        fieldname: 'balance',
        width: 0.5
      },
      {
        label: 'Reference Type',
        fieldtype: 'Data',
        fieldname: 'referenceType'
      },
      {
        label: 'Reference Name',
        fieldtype: 'Data',
        fieldname: 'referenceName'
      },
      {
        label: 'Party',
        fieldtype: 'Link',
        fieldname: 'party',
        component(cellValue) {
          return partyWithAvatar(cellValue);
        }
      },
      {
        label: 'Description',
        fieldtype: 'Data',
        fieldname: 'description'
      }
    ];
  }
};

export default viewConfig;
