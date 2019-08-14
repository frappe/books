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
        if (query)
          return {
            keywords: ['like', query],
            isGroup: 0,
            accountType: 'Receivable'
          };
        return {
          isGroup: 0,
          accountType: 'Receivable'
        };
      }
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
      formula: doc => frappe.format(doc.getSum('items', 'amount'), 'Currency'),
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
                            <div class='col-6'>{{row.account}} ({{row.rate}}%)</div>
                            <div class='col-6 text-right'>
                                {{frappe.format(row.amount, 'Currency')}}
                            </div>
                        </div>
                    </div>
                </div>`;
      }
    },
    {
      fieldname: 'grandTotal',
      label: 'Grand Total',
      fieldtype: 'Currency',
      formula: doc => doc.getGrandTotal(),
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
      columns: [{ fields: ['customer', 'account'] }, { fields: ['date'] }]
    },

    // section 2
    {
      columns: [{ fields: ['items'] }]
    },

    // section 3
    {
      columns: [{ fields: ['netTotal', 'taxes', 'grandTotal'] }]
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
        form.doc.submitted && form.doc.outstandingAmount !== 0.0,
      action: async form => {
        const payment = await frappe.getNewDoc('Payment');
        payment.paymentType = 'Receive';
        payment.party = form.doc.customer;
        payment.account = form.doc.account;
        payment.for = [
          {
            referenceType: form.doc.doctype,
            referenceName: form.doc.name,
            amount: form.doc.grandTotal
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
