const { t } = require('frappe');

module.exports = {
  name: 'User',
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: ['name', 'fullName'],
  fields: [
    {
      fieldname: 'name',
      label: t`Email`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'password',
      label: t`Password`,
      fieldtype: 'Password',
      required: 1,
      hidden: 1,
    },
    {
      fieldname: 'fullName',
      label: t`Full Name`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'roles',
      label: t`Roles`,
      fieldtype: 'Table',
      childtype: 'UserRole',
    },
    {
      fieldname: 'userId',
      label: t`User ID`,
      fieldtype: 'Data',
      hidden: 1,
    },
  ],
};
