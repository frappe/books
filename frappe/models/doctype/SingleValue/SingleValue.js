const { t } = require('frappe');

module.exports = {
  name: 'SingleValue',
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'parent',
      label: t`Parent`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'fieldname',
      label: t`Fieldname`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'value',
      label: t`Value`,
      fieldtype: 'Data',
      required: 1,
    },
  ],
};
