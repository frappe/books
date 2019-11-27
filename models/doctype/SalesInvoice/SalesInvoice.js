const frappe = require('frappejs');
const utils = require('../../../accounting/utils');
const router = require('@/router').default;
const InvoiceTemplate = require('./InvoiceTemplate.vue').default;

module.exports = {
  name: 'SalesInvoice',
  label: 'Sales Invoice',
  doctype: 'DocType',
  documentClass: require('./SalesInvoiceDocument'),
  print: {
    printFormat: 'Standard Invoice Format'
  },
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: ['name', 'customer'],
  settings: 'SalesInvoiceSettings',
  showTitle: true,
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
      hidden: 1,
      formula: doc => doc.getFrom('Party', doc.customer, 'currency')
    },
    {
      fieldname: 'exchangeRate',
      label: 'Exchange Rate',
      fieldtype: 'Float'
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
      readOnly: 1
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
      readOnly: 1
    },
    {
      fieldname: 'grandTotal',
      label: 'Grand Total',
      fieldtype: 'Currency',
      formula: async doc => await doc.getGrandTotal(),
      readOnly: 1
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
        return doc.grandTotal;
      },
      readOnly: 1
    },
    {
      fieldname: 'terms',
      label: 'Terms',
      fieldtype: 'Text'
    }
  ],

  layout: [
    // section 1
    {
      columns: [
        { fields: ['customer', 'account'] },
        { fields: ['date', 'exchangeRate'] }
      ]
    },

    // section 2
    {
      columns: [{ fields: ['items'] }]
    },

    // section 3
    {
      columns: [
        {
          fields: [
            'baseNetTotal',
            'netTotal',
            'taxes',
            'baseGrandTotal',
            'grandTotal'
          ]
        }
      ]
    },

    // section 4
    {
      columns: [{ fields: ['terms'] }]
    }
  ],

  actions: [
    {
      label: 'Make Payment',
      condition: doc => doc.submitted && doc.outstandingAmount > 0,
      action: async function makePayment(doc) {
        let payment = await frappe.getNewDoc('Payment');
        payment.once('afterInsert', () => {
          payment.submit();
        });
        this.$router.push({
          query: {
            edit: 1,
            doctype: 'Payment',
            name: payment.name,
            hideFields: ['party', 'date', 'account', 'paymentType', 'for'],
            values: {
              party: doc.customer,
              account: doc.account,
              date: new Date().toISOString().slice(0, 10),
              paymentType: 'Receive',
              for: [
                {
                  referenceType: doc.doctype,
                  referenceName: doc.name,
                  amount: doc.outstandingAmount
                }
              ]
            }
          }
        });
      }
    },
    {
      label: 'Revert',
      condition: doc =>
        doc.submitted && doc.baseGrandTotal === doc.outstandingAmount,
      action(doc) {
        doc.revert();
      }
    },
    {
      label: 'Print',
      condition: doc => doc.submitted,
      action(doc) {
        router.push(`/print/${doc.doctype}/${doc.name}`);
      }
    },
    utils.ledgerLink
  ],
  printTemplate: InvoiceTemplate
};
