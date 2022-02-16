import { t } from 'frappe';
import { getActions } from '../Transaction/Transaction';
import InvoiceTemplate from './InvoiceTemplate.vue';
import SalesInvoice from './SalesInvoiceDocument';

export default {
  name: 'SalesInvoice',
  label: t`Invoice`,
  doctype: 'DocType',
  documentClass: SalesInvoice,
  printTemplate: InvoiceTemplate,
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: ['name', 'customer'],
  settings: 'SalesInvoiceSettings',
  fields: [
    {
      label: t`Invoice No`,
      fieldname: 'name',
      fieldtype: 'Data',
      required: 1,
      readOnly: 1,
    },
    {
      fieldname: 'date',
      label: t`Date`,
      fieldtype: 'Date',
      default: () => new Date().toISOString().slice(0, 10),
    },
    {
      fieldname: 'customer',
      label: t`Customer`,
      fieldtype: 'Link',
      target: 'Customer',
      required: 1,
    },
    {
      fieldname: 'account',
      label: t`Account`,
      fieldtype: 'Link',
      target: 'Account',
      disableCreation: true,
      formula: (doc) => doc.getFrom('Party', doc.customer, 'defaultAccount'),
      getFilters: () => {
        return {
          isGroup: 0,
          accountType: 'Receivable',
        };
      },
    },
    {
      fieldname: 'currency',
      label: t`Customer Currency`,
      fieldtype: 'Link',
      target: 'Currency',
      formula: (doc) =>
        doc.getFrom('Party', doc.customer, 'currency') ||
        frappe.AccountingSettings.currency,
      formulaDependsOn: ['customer'],
    },
    {
      fieldname: 'exchangeRate',
      label: t`Exchange Rate`,
      fieldtype: 'Float',
      default: 1,
      formula: (doc) => doc.getExchangeRate(),
      readOnly: true,
    },
    {
      fieldname: 'items',
      label: t`Items`,
      fieldtype: 'Table',
      childtype: 'SalesInvoiceItem',
      required: true,
    },
    {
      fieldname: 'netTotal',
      label: t`Net Total`,
      fieldtype: 'Currency',
      formula: (doc) => doc.getSum('items', 'amount', false),
      readOnly: 1,
      getCurrency: (doc) => doc.currency,
    },
    {
      fieldname: 'baseNetTotal',
      label: t`Net Total (Company Currency)`,
      fieldtype: 'Currency',
      formula: (doc) => doc.netTotal.mul(doc.exchangeRate),
      readOnly: 1,
    },
    {
      fieldname: 'taxes',
      label: t`Taxes`,
      fieldtype: 'Table',
      childtype: 'TaxSummary',
      formula: (doc) => doc.getTaxSummary(),
      readOnly: 1,
    },
    {
      fieldname: 'grandTotal',
      label: t`Grand Total`,
      fieldtype: 'Currency',
      formula: (doc) => doc.getGrandTotal(),
      readOnly: 1,
      getCurrency: (doc) => doc.currency,
    },
    {
      fieldname: 'baseGrandTotal',
      label: t`Grand Total (Company Currency)`,
      fieldtype: 'Currency',
      formula: (doc) => doc.grandTotal.mul(doc.exchangeRate),
      readOnly: 1,
    },
    {
      fieldname: 'outstandingAmount',
      label: t`Outstanding Amount`,
      fieldtype: 'Currency',
      formula: (doc) => {
        if (doc.submitted) return;
        return doc.baseGrandTotal;
      },
      readOnly: 1,
    },
    {
      fieldname: 'terms',
      label: t`Notes`,
      fieldtype: 'Text',
    },
    {
      fieldname: 'cancelled',
      label: t`Cancelled`,
      fieldtype: 'Check',
      default: 0,
    },
  ],

  actions: getActions('SalesInvoice'),
};
