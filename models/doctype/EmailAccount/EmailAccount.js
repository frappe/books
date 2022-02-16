import frappe, { t } from 'frappe';

export default {
  name: 'EmailAccount',
  label: t`Email Account`,
  doctype: 'DocType',
  isSingle: true,
  isChild: false,
  keywordFields: ['email'],
  fields: [
    {
      fieldname: 'email',
      label: t`Email`,
      fieldtype: 'Data',
      required: 1,
      formula: async () => {
        const accountingSettings = await frappe.getDoc('AccountingSettings');
        return accountingSettings.email;
      },
    },
    {
      fieldname: 'password',
      label: t`Password`,
      fieldtype: 'Password',
      required: 1,
    },
    {
      fieldname: 'confirmPassword',
      label: t`Confirm Password`,
      fieldtype: 'Password',
      required: 1,
    },
    {
      fieldname: 'smtpHost',
      label: t`SMTP Host`,
      fieldtype: 'Select',
      options: [
        'smtp.gmail.com',
        'smtp.mail.yahoo.com',
        'smtp-mail.outlook.com',
        'smtp.mail.me.com',
        'smtp.aol.com',
      ],
      default: 'smtp.gmail.com',
    },
    {
      fieldname: 'smtpPort',
      label: t`SMTP Port`,
      fieldtype: 'Select',
      options: ['465', '587'],
      default: '465',
    },
  ],
};
