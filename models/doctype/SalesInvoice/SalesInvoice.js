const frappe = require('frappejs');
const utils = require('../../../accounting/utils');

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
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
      defaultValue: new Date().toISOString()
    },
    {
      fieldname: 'customer',
      label: 'Customer',
      fieldtype: 'Link',
      target: 'Party',
      required: 1,
      getFilters: query => {
        if (query)
          return {
            keywords: ['like', query],
            customer: 1
          };

        return {
          customer: 1
        };
      }
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      formula: doc => doc.getFrom('Party', doc.customer, 'defaultAccount'),
      getFilters: (query, control) => {
        if (!query) return { isGroup: 0, accountType: 'Receivable' };
        return {
          keywords: ['like', query],
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
      fieldtype: 'Float',
      placeholder: '1 USD = [?] INR',
      hidden: doc => !doc.isForeignTransaction()
    },
    {
      fieldname: 'items',
      label: 'Items',
      fieldtype: 'Table',
      childtype: 'SalesInvoiceItem',
      required: true
    },
    {
      fieldname: 'baseNetTotal',
      label: 'Net Total (INR)',
      fieldtype: 'Currency',
      formula: async doc => await doc.getBaseNetTotal(),
      disabled: true,
      readOnly: 1
    },
    {
      fieldname: 'netTotal',
      label: 'Net Total (USD)',
      fieldtype: 'Currency',
      hidden: doc => !doc.isForeignTransaction(),
      formula: async doc =>
        await doc.formatIntoCustomerCurrency(doc.getSum('items', 'amount')),
      disabled: true,
      readOnly: 1
    },
    {
      fieldname: 'taxes',
      label: 'Taxes',
      fieldtype: 'Table',
      childtype: 'TaxSummary',
      readOnly: 1,
      template: (doc, row) => {
        return `<div class='row'>
                    <div class='col-6'></div>
                    <div class='col-6'>
                        <div class='row' v-for='row in value'>
                            <div class='col-6'>{{ row.account }} ({{row.rate}}%)</div>
                            <div class='col-6 text-right'>
                                {{ row.amount }}
                            </div>
                        </div>
                    </div>
                </div>`;
      }
    },
    {
      fieldname: 'baseGrandTotal',
      label: 'Grand Total (INR)',
      fieldtype: 'Currency',
      formula: async doc => await doc.getBaseGrandTotal(),
      disabled: true,
      readOnly: 1
    },
    {
      fieldname: 'grandTotal',
      label: 'Grand Total (USD)',
      fieldtype: 'Currency',
      hidden: doc => !doc.isForeignTransaction(),
      formula: async doc => await doc.getGrandTotal(),
      disabled: true,
      readOnly: 1
    },
    {
      fieldname: 'outstandingAmount',
      label: 'Outstanding Amount',
      fieldtype: 'Currency',
      hidden: 1
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

  links: [
    utils.ledgerLink,
    {
      label: 'Make Payment',
      condition: form =>
        form.doc.submitted && form.doc.outstandingAmount != 0.0,
      action: async form => {
        const payment = await frappe.getNewDoc('Payment');
        payment.paymentType = 'Receive';
        payment.party = form.doc.customer;
        payment.account = form.doc.account;
        payment.for = [
          {
            referenceType: form.doc.doctype,
            referenceName: form.doc.name,
            amount: form.doc.outstandingAmount
          }
        ];
        payment.on('afterInsert', async () => {
          form.$formModal.close();
          form.$router.push({
            path: `/edit/Payment/${payment.name}`
          });
        });
        await form.$formModal.open(payment);
      }
    }
  ]
};
