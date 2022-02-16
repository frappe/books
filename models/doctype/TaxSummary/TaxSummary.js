import { t } from 'frappe';
export default {
  name: 'TaxSummary',
  doctype: 'DocType',
  isChild: 1,
  fields: [
    {
      fieldname: 'account',
      label: t`Tax Account`,
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
    },
    {
      fieldname: 'rate',
      label: t`Rate`,
      fieldtype: 'Float',
      required: 1,
    },
    {
      fieldname: 'amount',
      label: t`Amount`,
      fieldtype: 'Currency',
      required: 1,
    },
    {
      fieldname: 'baseAmount',
      label: t`Amount (Company Currency)`,
      fieldtype: 'Currency',
      formula: (row, doc) => row.amount.mul(doc.exchangeRate),
      readOnly: 1,
    },
  ],
};
