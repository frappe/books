module.exports = {
  name: 'Dashboard',
  label: 'Dashboard Settings',
  doctype: 'DocType',
  isSingle: 1,
  fields: [
    {
      fieldname: 'charts',
      fieldtype: 'Table',
      label: 'Charts',
      childtype: 'DashboardChart'
    }
  ]
};
