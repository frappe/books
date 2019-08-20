const frappe = require('frappejs');
const utils = require('../../../accounting/utils');

module.exports = {
  name: 'PurchaseInvoice',
  doctype: 'DocType',
  label: 'Purchase Invoice',
  documentClass: require('./PurchaseInvoiceDocument'),
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: ['name', 'supplier'],
  settings: 'PurchaseInvoiceSettings',
  showTitle: true,
  fields: [
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
      defaultValue: new Date().toISOString()
    },
    {
      fieldname: 'supplier',
      label: 'Supplier',
      fieldtype: 'Link',
      target: 'Party',
      required: 1,
      getFilters: (query, control) => {
        if (!query) return { supplier: 1 };
        return {
          keywords: ['like', query],
          supplier: 1
        };
      }
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      formula: doc => doc.getFrom('Party', doc.supplier, 'defaultAccount'),
      getFilters: (query, control) => {
        if (!query) return { isGroup: 0, accountType: 'Payable' };
        return {
          keywords: ['like', query],
          isGroup: 0,
          accountType: 'Payable'
        };
      }
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
      fieldname: 'terms',
      label: 'Terms',
      fieldtype: 'Text'
    },
    {
      fieldname: 'outstandingAmount',
      label: 'Outstanding Amount',
      fieldtype: 'Currency',
      hidden: 1
    }
  ],

  layout: [
    // section 1
    {
      columns: [{ fields: ['supplier', 'account'] }, { fields: ['date'] }]
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
        form.doc.submitted && form.doc.outstandingAmount != 0.0,
      action: async form => {
        const payment = await frappe.getNewDoc('Payment');
        payment.paymentType = 'Pay';
        payment.party = form.doc.supplier;
        payment.paymentAccount = form.doc.account;
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
