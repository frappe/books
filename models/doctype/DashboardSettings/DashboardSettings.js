module.exports = {
  name: 'DashboardSettings',
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
