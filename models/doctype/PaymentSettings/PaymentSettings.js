import { t } from 'frappe';

export default {
  name: 'PaymentSettings',
  label: t`Payment Settings`,
  isSingle: 1,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'numberSeries',
      label: t`Number Series`,
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      default: 'PAY',
    },
  ],
};
