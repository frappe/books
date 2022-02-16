import frappe, { t } from 'frappe';

export default {
  name: 'Email',
  doctype: 'DocType',
  pageSettings: {
    hideTitle: true,
  },
  isSingle: 0,
  isChild: 0,
  keywordFields: ['name'],
  fields: [
    {
      fieldname: 'name',
      label: t`name`,
      fieldtype: 'Data',
      required: 0,
      hidden: 1,
      disabled: 0,
    },
    {
      fieldname: 'fromEmailAddress',
      label: t`From`,
      fieldtype: 'Data',
      required: 1,
      hidden: 0,
      formula: async () => {
        const accountingSettings = await frappe.getDoc('AccountingSettings');
        return accountingSettings.email;
      },
      disabled: 1,
    },
    {
      fieldname: 'toEmailAddress',
      label: t`To`,
      fieldtype: 'Data',
      required: 1,
      hidden: 0,
      disabled: 0,
    },
    {
      fieldname: 'date',
      label: t`Date`,
      fieldtype: 'Datetime',
      required: 0,
      hidden: 0,
      disabled: 1,
    },
    {
      fieldname: 'subject',
      label: t`Subject`,
      fieldtype: 'Data',
      required: 0,
      hidden: 0,
      disabled: 0,
    },
    {
      fieldname: 'bodyText',
      label: t`Body`,
      fieldtype: 'Text',
      required: 0,
      hidden: 0,
      disabled: 0,
    },
    {
      fieldname: 'filePath',
      label: t`File Path`,
      fieldtype: 'Text',
      required: 0,
      hidden: 1,
    },
  ],
};
