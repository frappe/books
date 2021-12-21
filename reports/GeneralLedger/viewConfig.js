import { partyWithAvatar } from '@/utils';
import getCommonExportActions from '../commonExporter';

let title = 'General Ledger';

const viewConfig = {
  title,
  filterFields: [
    {
      fieldtype: 'Select',
      options: [
        { label: 'All References', value: 'All' },
        { label: 'Invoices', value: 'SalesInvoice' },
        { label: 'Bills', value: 'PurchaseInvoice' },
        { label: 'Payment', value: 'Payment' },
        { label: 'Journal Entry', value: 'JournalEntry' },
      ],
      size: 'small',
      label: 'Reference Type',
      fieldname: 'referenceType',
      placeholder: 'Reference Type',
      default: 'All',
    },
    {
      fieldtype: 'DynamicLink',
      size: 'small',
      placeholder: 'Reference Name',
      references: 'referenceType',
      label: 'Reference Name',
      fieldname: 'referenceName',
    },
    {
      fieldtype: 'Link',
      target: 'Account',
      size: 'small',
      placeholder: 'Account',
      label: 'Account',
      fieldname: 'account',
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      label: 'Party',
      size: 'small',
      placeholder: 'Party',
      fieldname: 'party',
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'From Date',
      label: 'From Date',
      fieldname: 'fromDate',
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'To Date',
      label: 'To Date',
      fieldname: 'toDate',
    },
    {
      fieldtype: 'Check',
      size: 'small',
      default: 0,
      label: 'Cancelled',
      fieldname: 'reverted',
    },
  ],
  method: 'general-ledger',
  actions: getCommonExportActions('general-ledger'),
  getColumns() {
    return [
      {
        label: 'Account',
        fieldtype: 'Link',
        fieldname: 'account',
        width: 1.5,
      },
      {
        label: 'Date',
        fieldtype: 'Date',
        fieldname: 'date',
        width: 0.75,
      },
      {
        label: 'Debit',
        fieldtype: 'Currency',
        fieldname: 'debit',
        width: 1.25,
      },
      {
        label: 'Credit',
        fieldtype: 'Currency',
        fieldname: 'credit',
        width: 1.25,
      },
      {
        label: 'Balance',
        fieldtype: 'Currency',
        fieldname: 'balance',
        width: 1.25,
      },
      {
        label: 'Reference Type',
        fieldtype: 'Data',
        fieldname: 'referenceType',
      },
      {
        label: 'Reference Name',
        fieldtype: 'Data',
        fieldname: 'referenceName',
      },
      {
        label: 'Party',
        fieldtype: 'Link',
        fieldname: 'party',
        component(cellValue) {
          return partyWithAvatar(cellValue);
        },
      },
    ];
  },
};

export default viewConfig;
