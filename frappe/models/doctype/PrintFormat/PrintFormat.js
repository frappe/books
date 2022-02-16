const { t } = require('frappe');

module.exports = {
  name: 'PrintFormat',
  label: t`Print Format`,
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'name',
      label: t`Name`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'for',
      label: t`For`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'template',
      label: t`Template`,
      fieldtype: 'Code',
      required: 1,
      options: {
        mode: 'text/html',
      },
    },
  ],
};
