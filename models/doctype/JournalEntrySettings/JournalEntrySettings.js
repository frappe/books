import { t } from 'frappe';
export default {
  name: 'JournalEntrySettings',
  label: t`Journal Entry Setting`,
  doctype: 'DocType',
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
      default: 'JV',
    },
  ],
};
