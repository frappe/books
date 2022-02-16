import { t } from 'frappe';
export default {
  name: 'TaxDetail',
  label: t`Tax Detail`,
  doctype: 'DocType',
  isSingle: 0,
  isChild: 1,
  keywordFields: [],
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
      placeholder: '0%',
    },
  ],
  tableFields: ['account', 'rate'],
};
