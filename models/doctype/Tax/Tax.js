import { t } from 'frappe';
export default {
  name: 'Tax',
  label: t`Tax`,
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: ['name'],
  fields: [
    {
      fieldname: 'name',
      label: t`Name`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'details',
      label: t`Details`,
      fieldtype: 'Table',
      childtype: 'TaxDetail',
      required: 1,
    },
  ],
  quickEditFields: ['details'],
};
