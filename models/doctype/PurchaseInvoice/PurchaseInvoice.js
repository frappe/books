import { getActions } from '../Transaction/Transaction';
import InvoiceTemplate from '../SalesInvoice/InvoiceTemplate.vue';
import PurchaseInvoice from './PurchaseInvoiceDocument';

export default {
  name: 'PurchaseInvoice',
  doctype: 'DocType',
  label: 'Purchase Invoice',
  documentClass: PurchaseInvoice,
  printTemplate: InvoiceTemplate,
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: ['name', 'supplier'],
  settings: 'PurchaseInvoiceSettings',
  showTitle: true,
  fields: [
    {
      label: 'Bill No',
      fieldname: 'name',
      fieldtype: 'Data',
      required: 1,
      readOnly: 1
    },
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
      default: () => new Date().toISOString().slice(0, 10)
    },
    {
      fieldname: 'supplier',
      label: 'Supplier',
      fieldtype: 'Link',
      target: 'Supplier',
      required: 1
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      formula: doc => doc.getFrom('Party', doc.supplier, 'defaultAccount'),
      getFilters: () => {
        return {
          isGroup: 0,
          accountType: 'Payable'
        };
      }
    },
    {
      fieldname: 'currency',
      label: 'Supplier Currency',
      fieldtype: 'Link',
      target: 'Currency',
      hidden: 1,
      formula: doc => doc.getFrom('Party', doc.supplier, 'currency'),
      formulaDependsOn: ['supplier']
    },
    {
      fieldname: 'exchangeRate',
      label: 'Exchange Rate',
      fieldtype: 'Float',
      formula: doc => doc.getExchangeRate(),
      required: true
    },
    {
      fieldname: 'items',
      label: 'Items',
      fieldtype: 'Table',
      childtype: 'PurchaseInvoiceItem',
      required: true
    },
    {
      fieldname: 'netTotal',
      label: 'Net Total',
      fieldtype: 'Currency',
      formula: doc => doc.getSum('items', 'amount'),
      readOnly: 1,
      getCurrency: doc => doc.currency
    },
    {
      fieldname: 'baseNetTotal',
      label: 'Net Total (Company Currency)',
      fieldtype: 'Currency',
      formula: doc => doc.netTotal * doc.exchangeRate,
      readOnly: 1
    },
    {
      fieldname: 'taxes',
      label: 'Taxes',
      fieldtype: 'Table',
      childtype: 'TaxSummary',
      formula: doc => doc.getTaxSummary(),
      readOnly: 1
    },
    {
      fieldname: 'grandTotal',
      label: 'Grand Total',
      fieldtype: 'Currency',
      formula: doc => doc.getGrandTotal(),
      readOnly: 1,
      getCurrency: doc => doc.currency
    },
    {
      fieldname: 'baseGrandTotal',
      label: 'Grand Total (Company Currency)',
      fieldtype: 'Currency',
      formula: doc => doc.grandTotal * doc.exchangeRate,
      readOnly: 1
    },
    {
      fieldname: 'outstandingAmount',
      label: 'Outstanding Amount',
      fieldtype: 'Currency',
      formula: doc => {
        if (doc.submitted) return;
        return doc.baseGrandTotal;
      },
      readOnly: 1
    },
    {
      fieldname: 'terms',
      label: 'Terms',
      fieldtype: 'Text'
    },
    {
      fieldname: 'cancelled',
      label: 'Cancelled',
      fieldtype: 'Check',
      default: 0
    }
  ],

  actions: getActions('PurchaseInvoice')
};
