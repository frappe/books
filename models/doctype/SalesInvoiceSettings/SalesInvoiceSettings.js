import { t } from 'frappe';
export default {
  name: 'SalesInvoiceSettings',
  label: t`SalesInvoice Settings`,
  doctype: 'DocType',
  isSingle: 1,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'template',
      label: t`Template`,
      placeholder: t`Template`,
      fieldtype: 'Select',
      options: ['Basic I', 'Basic II', 'Modern'],
      required: 1,
      default: 'Basic I',
    },
    {
      fieldname: 'font',
      label: t`Font`,
      placeholder: t`Font`,
      fieldtype: 'Select',
      options: ['Montserrat', 'Open Sans', 'Oxygen', 'Merriweather'],
      required: 1,
      default: 'Montserrat',
    },
    {
      fieldname: 'themeColor',
      label: t`Theme Color`,
      fieldtype: 'Data',
      required: 1,
      default: '#000000',
      hidden: 1,
    },
  ],
};
