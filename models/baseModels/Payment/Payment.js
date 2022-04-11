import frappe, { t } from 'frappe';
import utils from '../../../accounting/utils';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';

const paymentTypeMap = {
  Receive: t`Receive`,
  Pay: t`Pay`,
};

const paymentMethodMap = {
  Cash: t`Cash`,
  Cheque: t`Cheque`,
  Transfer: t`Transfer`,
};

export default {
  name: 'Payment',
  label: t`Payment`,
  isSingle: 0,
  isChild: 0,
  isSubmittable: 1,
  keywordFields: [],
  settings: 'PaymentSettings',
  fields: [
    {
      label: t`Payment No`,
      fieldname: 'name',
      fieldtype: 'Data',
      required: 1,
      readOnly: 1,
    },
    {
      fieldname: 'party',
      label: t`Party`,
      fieldtype: 'Link',
      target: 'Party',
      required: 1,
    },
    {
      fieldname: 'date',
      label: t`Posting Date`,
      fieldtype: 'Date',
      default: () => new Date().toISOString(),
    },
    {
      fieldname: 'account',
      label: t`From Account`,
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
      formula: (doc) => {
        if (doc.paymentMethod === 'Cash' && doc.paymentType === 'Pay') {
          return 'Cash';
        }
      },
    },
    {
      fieldname: 'paymentType',
      label: t`Payment Type`,
      fieldtype: 'Select',
      placeholder: t`Payment Type`,
      options: Object.keys(paymentTypeMap),
      map: paymentTypeMap,
      required: 1,
    },
    {
      fieldname: 'paymentAccount',
      label: t`To Account`,
      placeholder: t`To Account`,
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
        if (doc.paymentMethod === 'Cash' && doc.paymentType === 'Receive') {
          return 'Cash';
        }
      },
    },
    {
      fieldname: 'numberSeries',
      label: t`Number Series`,
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      getFilters: () => {
        return { referenceType: 'Payment' };
      },
      default: DEFAULT_NUMBER_SERIES['Payment'],
    },
    {
      fieldname: 'paymentMethod',
      label: t`Payment Method`,
      placeholder: t`Payment Method`,
      fieldtype: 'Select',
      options: Object.keys(paymentMethodMap),
      map: paymentMethodMap,
      default: 'Cash',
      required: 1,
    },
    {
      fieldname: 'referenceId',
      label: t`Ref. / Cheque No.`,
      placeholder: t`Ref. / Cheque No.`,
      fieldtype: 'Data',
      required: (doc) => doc.paymentMethod !== 'Cash', // TODO: UNIQUE
      hidden: (doc) => doc.paymentMethod === 'Cash',
    },
    {
      fieldname: 'referenceDate',
      label: t`Ref. Date`,
      placeholder: t`Ref. Date`,
      fieldtype: 'Date',
    },
    {
      fieldname: 'clearanceDate',
      label: t`Clearance Date`,
      placeholder: t`Clearance Date`,
      fieldtype: 'Date',
      hidden: (doc) => doc.paymentMethod === 'Cash',
    },
    {
      fieldname: 'amount',
      label: t`Amount`,
      fieldtype: 'Currency',
      required: 1,
      formula: (doc) => doc.getSum('for', 'amount', false),
      validate(value, doc) {
        if (value.isNegative()) {
          throw new frappe.errors.ValidationError(
            frappe.t`Payment amount cannot be less than zero.`
          );
        }

        if (doc.for.length === 0) return;
        const amount = doc.getSum('for', 'amount', false);

        if (value.gt(amount)) {
          throw new frappe.errors.ValidationError(
            frappe.t`Payment amount cannot 
              exceed ${frappe.format(amount, 'Currency')}.`
          );
        } else if (value.isZero()) {
          throw new frappe.errors.ValidationError(
            frappe.t`Payment amount cannot
              be ${frappe.format(value, 'Currency')}.`
          );
        }
      },
    },
    {
      fieldname: 'writeoff',
      label: t`Write Off / Refund`,
      fieldtype: 'Currency',
    },
    {
      fieldname: 'for',
      label: t`Payment Reference`,
      fieldtype: 'Table',
      childtype: 'PaymentFor',
      required: 0,
    },
    {
      fieldname: 'cancelled',
      label: t`Cancelled`,
      fieldtype: 'Check',
      default: 0,
      readOnly: 1,
    },
  ],

  quickEditFields: [
    'numberSeries',
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
