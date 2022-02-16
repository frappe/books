import { t } from 'frappe';
import InvoiceTemplate from '../SalesInvoice/InvoiceTemplate.vue';
import { getActions } from '../Transaction/Transaction';
import PurchaseInvoice from './PurchaseInvoiceDocument';

export default {
  name: 'PurchaseInvoice',
  doctype: 'DocType',
  label: t`Bill`,
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
      label: t`Bill No`,
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
      fieldname: 'supplier',
      label: t`Supplier`,
      fieldtype: 'Link',
      target: 'Supplier',
      required: 1,
    },
    {
      fieldname: 'account',
      label: t`Account`,
      fieldtype: 'Link',
      target: 'Account',
      formula: (doc) => doc.getFrom('Party', doc.supplier, 'defaultAccount'),
      getFilters: () => {
        return {
          isGroup: 0,
          accountType: 'Payable',
        };
      },
    },
    {
      fieldname: 'currency',
      label: t`Supplier Currency`,
      fieldtype: 'Link',
      target: 'Currency',
      hidden: 1,
      formula: (doc) =>
        doc.getFrom('Party', doc.supplier, 'currency') ||
        frappe.AccountingSettings.currency,
      formulaDependsOn: ['supplier'],
    },
    {
      fieldname: 'exchangeRate',
      label: t`Exchange Rate`,
      fieldtype: 'Float',
      default: 1,
      formula: async (doc) => await doc.getExchangeRate(),
      required: true,
    },
    {
      fieldname: 'items',
      label: t`Items`,
      fieldtype: 'Table',
      childtype: 'PurchaseInvoiceItem',
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
      label: t`Terms`,
      fieldtype: 'Text',
    },
    {
      fieldname: 'cancelled',
      label: t`Cancelled`,
      fieldtype: 'Check',
      default: 0,
    },
  ],

  actions: getActions('PurchaseInvoice'),
};
