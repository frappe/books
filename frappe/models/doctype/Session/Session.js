const { t } = require('frappe');

module.exports = {
  name: 'Session',
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'username',
      label: t`Username`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'password',
      label: t`Password`,
      fieldtype: 'Password',
      required: 1,
    },
  ],
};
