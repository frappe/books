module.exports = {
  name: 'DashboardChart',
  doctype: 'DocType',
  isChild: 1,
  fields: [
    {
      fieldname: 'account',
      fieldtype: 'Link',
      label: 'Account',
      target: 'Account'
    },
    {
      fieldname: 'type',
      fieldtype: 'Select',
      options: ['', 'Bar', 'Line', 'Percentage'],
      label: 'Chart Type'
    },
    {
      fieldname: 'color',
      fieldtype: 'Data',
      label: 'Color'
    }
  ]
};
