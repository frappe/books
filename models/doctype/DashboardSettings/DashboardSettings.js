module.exports = {
  name: 'Dashboard',
  label: 'Dashboard Settings',
  doctype: 'DocType',
  isSingle: 1,
  fields: [
    {
      fieldname: 'name',
      fieldtype: 'Data',
      label: 'Dashboard Name'
    },
    {
      fieldname: 'charts',
      fieldtype: 'Table',
      label: 'Charts',
      childtype: 'DashboardChart'
    }
  ]
};
