const utils = require('../../../accounting/utils');

module.exports = {
  name: 'Payment',
  label: 'Payment',
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: [],
  settings: 'PaymentSettings',
  fields: [
    {
      fieldname: 'date',
      label: 'Posting Date',
      fieldtype: 'Date'
      // default: new Date().toISOString().substring(0, 10)
    },
    {
      fieldname: 'party',
      label: 'Party',
      fieldtype: 'Link',
      target: 'Party',
      required: 1
    },
    {
      fieldname: 'account',
      label: 'From Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1
    },
    {
      fieldname: 'paymentType',
      label: 'Payment Type',
      fieldtype: 'Select',
      options: ['Recieve', 'Pay'],
      required: 1
    },
    {
      fieldname: 'paymentAccount',
      label: 'To Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
      getFilters: (query, doc) => {
        return {
          isGroup: 0
        };
      }
    },
    {
      fieldname: 'paymentMethod',
      label: 'Payment Method',
      fieldtype: 'Select',
      options: ['', 'Cash', 'Cheque'],
      required: 1
    },
    {
      fieldname: 'referenceId',
      label: 'Ref. / Cheque No.',
      fieldtype: 'Data',
      required: 1 // TODO: UNIQUE
    },
    {
      fieldname: 'referenceDate',
      label: 'Ref. Date',
      fieldtype: 'Date'
    },
    {
      fieldname: 'clearanceDate',
      label: 'Clearance Date',
      fieldtype: 'Date',
      hidden: doc => {
        return doc.paymentMethod === 'Cheque' ? 0 : 1;
      }
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      required: 1,
      disabled: true,
      formula: doc => doc.getSum('for', 'amount')
    },
    {
      fieldname: 'writeoff',
      label: 'Write Off / Refund',
      fieldtype: 'Currency'
    },
    {
      fieldname: 'for',
      label: 'Payment For',
      fieldtype: 'Table',
      childtype: 'PaymentFor',
      required: 1
    }
  ],

  layout: [
    {
      columns: [
        {
          fields: ['date', 'account']
        },
        {
          fields: ['party', 'paymentAccount']
        }
      ]
    },
    {
      columns: [
        {
          fields: ['paymentMethod']
        },
        {
          fields: ['paymentType']
        },
        {
          fields: ['referenceId']
        }
      ]
    },
    {
      columns: [
        {
          fields: ['referenceDate']
        },
        {
          fields: ['clearanceDate']
        }
      ]
    },
    {
      columns: [
        {
          fields: ['for']
        }
      ]
    },
    {
      columns: [
        {
          fields: ['amount', 'writeoff']
        }
      ]
    }
  ],

  links: [utils.ledgerLink]
};
