const { t } = require('frappe');

module.exports = {
  name: 'PatchRun',
  fields: [
    {
      fieldname: 'name',
      fieldtype: 'Data',
      label: t`Name`,
    },
  ],
};
