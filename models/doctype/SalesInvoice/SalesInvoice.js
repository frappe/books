const { getActions } = require('../Transaction/Transaction');
const InvoiceTemplate = require('./InvoiceTemplate.vue').default;

module.exports = {
  name: 'SalesInvoice',
  label: 'Sales Invoice',
  doctype: 'DocType',
  documentClass: require('./SalesInvoiceDocument'),
  printTemplate: InvoiceTemplate,
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: ['name', 'customer'],
  settings: 'SalesInvoiceSettings',
  fields: [
    {
      label: 'Invoice No',
      fieldname: 'name',
      fieldtype: 'Data',
      required: 1,
      readOnly: 1
    },
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
      default: new Date().toISOString().slice(0, 10)
    },
    {
      fieldname: 'customer',
      label: 'Customer',
      fieldtype: 'Link',
      target: 'Customer',
      required: 1
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      disableCreation: true,
      formula: doc => doc.getFrom('Party', doc.customer, 'defaultAccount'),
      getFilters: () => {
        return {
          isGroup: 0,
          accountType: 'Receivable'
        };
      }
    },
    {
      fieldname: 'currency',
      label: 'Customer Currency',
      fieldtype: 'Link',
      target: 'Currency',
      formula: doc => doc.getFrom('Party', doc.customer, 'currency'),
      formulaDependsOn: ['customer']
    },
    {
      fieldname: 'exchangeRate',
      label: 'Exchange Rate',
      fieldtype: 'Float',
      formula: doc => doc.getExchangeRate(),
      readOnly: true
    },
    {
      fieldname: 'items',
      label: 'Items',
      fieldtype: 'Table',
      childtype: 'SalesInvoiceItem',
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
      label: 'Notes',
      fieldtype: 'Text'
    }
  ],

  actions: getActions('SalesInvoice')
};
