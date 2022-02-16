import { t } from 'frappe';

export default {
  name: 'CompanySettings',
  label: t`Company Settings`,
  naming: 'autoincrement',
  isSingle: true,
  isChild: false,
  keywordFields: ['companyName'],
  fields: [
    {
      fieldname: 'companyName',
      label: t`Company Name`,
      fieldtype: 'Data',
      disabled: false,
      required: true,
    },
    {
      fieldname: 'companyAddress',
      label: t`Company Address`,
      fieldtype: 'Link',
      disabled: false,
      required: true,
      target: 'Address',
    },
  ],
};
