const { t } = require('frappe');

module.exports = {
  name: 'Role',
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
  ],
};
