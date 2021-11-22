import frappe from 'frappejs';
import utils from '../../../accounting/utils';

export default {
  name: 'Payment',
  label: 'Payment',
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: [],
  settings: 'PaymentSettings',
  fields: [
    {
      fieldname: 'party',
      label: 'Party',
      fieldtype: 'Link',
      target: 'Party',
      required: 1,
    },
    {
      fieldname: 'date',
      label: 'Posting Date',
      fieldtype: 'Date',
      default: () => new Date().toISOString(),
    },
    {
      fieldname: 'account',
      label: 'From Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
      getFilters: (query, doc) => {
        if (doc.paymentType === 'Pay') {
          if (doc.paymentMethod === 'Cash') {
            return { accountType: 'Cash', isGroup: 0 };
          } else {
            return { accountType: ['in', ['Bank', 'Cash']], isGroup: 0 };
          }
        }
      },
    },
    {
      fieldname: 'paymentType',
      label: 'Payment Type',
      fieldtype: 'Select',
      options: ['', 'Receive', 'Pay'],
      required: 1,
    },
    {
      fieldname: 'paymentAccount',
      label: 'To Account',
      placeholder: 'To Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
      getFilters: (query, doc) => {
        if (doc.paymentType === 'Receive') {
          if (doc.paymentMethod === 'Cash') {
            return { accountType: 'Cash', isGroup: 0 };
          } else {
            return { accountType: ['in', ['Bank', 'Cash']], isGroup: 0 };
          }
        }
      },
      formula: (doc) => {
        if (doc.paymentMethod === 'Cash') {
          return 'Cash';
        }
      },
    },
    {
      fieldname: 'paymentMethod',
      label: 'Payment Method',
      placeholder: 'Payment Method',
      fieldtype: 'Select',
      options: ['', 'Cash', 'Cheque', 'Transfer'],
      default: 'Cash',
      required: 1,
    },
    {
      fieldname: 'referenceId',
      label: 'Ref. / Cheque No.',
      placeholder: 'Ref. / Cheque No.',
      fieldtype: 'Data',
      required: (doc) => doc.paymentMethod !== 'Cash', // TODO: UNIQUE
    },
    {
      fieldname: 'referenceDate',
      label: 'Ref. Date',
      placeholder: 'Ref. Date',
      fieldtype: 'Date',
    },
    {
      fieldname: 'clearanceDate',
      label: 'Clearance Date',
      placeholder: 'Clearance Date',
      fieldtype: 'Date',
      hidden: (doc) => doc.paymentMethod === 'Cash',
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      required: 1,
      formula: (doc) => doc.getSum('for', 'amount'),
      validate(value, doc) {
        if (value < 0) {
          throw new frappe.errors.ValidationError(
            frappe._(
              `Payment amount cannot be less than zero. Amount has been reset to max viable amount.`
            )
          );
        }

        if (doc.for.length === 0) return;
        const amount = doc.getSum('for', 'amount');

        if (value > amount) {
          throw new frappe.errors.ValidationError(
            frappe._(
              `Payment amount cannot exceed ${frappe.format(
                amount,
                'Currency'
              )}. Amount has been reset to max viable amount.`
            )
          );
        } else if (value === 0) {
          throw new frappe.errors.ValidationError(
            frappe._(
              `Payment amount cannot be ${frappe.format(
                value,
                'Currency'
              )}. Amount has been reset to max viable amount.`
            )
          );
        }
      },
    },
    {
      fieldname: 'writeoff',
      label: 'Write Off / Refund',
      fieldtype: 'Currency',
    },
    {
      fieldname: 'for',
      label: 'Payment Reference',
      fieldtype: 'Table',
      childtype: 'PaymentFor',
      required: 0,
    },
    {
      fieldname: 'cancelled',
      label: 'Cancelled',
      fieldtype: 'Check',
      default: 0,
    },
  ],

  quickEditFields: [
    'party',
    'date',
    'paymentMethod',
    'account',
    'paymentType',
    'paymentAccount',
    'referenceId',
    'referenceDate',
    'clearanceDate',
    'amount',
    'writeoff',
    'for',
  ],

  layout: [
    {
      columns: [
        {
          fields: ['party', 'account'],
        },
        {
          fields: ['date', 'paymentAccount'],
        },
      ],
    },
    {
      columns: [
        {
          fields: ['paymentMethod'],
        },
        {
          fields: ['paymentType'],
        },
        {
          fields: ['referenceId'],
        },
      ],
    },
    {
      columns: [
        {
          fields: ['referenceDate'],
        },
        {
          fields: ['clearanceDate'],
        },
      ],
    },
    {
      columns: [
        {
          fields: ['for'],
        },
      ],
    },
    {
      columns: [
        {
          fields: ['amount', 'writeoff'],
        },
      ],
    },
  ],
  actions: [utils.ledgerLink],
  links: [utils.ledgerLink],
};
