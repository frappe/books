module.exports = {
  name: 'PrintSettings',
  label: 'Print Settings',
  isSingle: 1,
  isChild: 0,
  fields: [
    {
      fieldname: 'logo',
      label: 'Logo',
      fieldtype: 'AttachImage'
    },
    {
      fieldname: 'companyName',
      label: 'Company Name',
      fieldtype: 'Data'
    },
    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data'
    },
    {
      fieldname: 'displayLogo',
      label: 'Display Logo in Invoice',
      fieldtype: 'Check'
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      fieldtype: 'Data'
    },
    {
      fieldname: 'address',
      label: 'Address',
      fieldtype: 'Link',
      target: 'Address',
      inline: true
    },
    {
      fieldname: 'gstin',
      label: 'GSTIN',
      fieldtype: 'Data'
    },
    {
      fieldname: 'template',
      label: 'Template',
      fieldtype: 'Select',
      options: ['Basic', 'Modern'],
      default: 'Basic'
    },
    {
      fieldname: 'color',
      label: 'Theme Color',
      fieldtype: 'Data'
    },
    {
      fieldname: 'font',
      label: 'Font',
      fieldtype: 'Select',
      options: ['Inter', 'Roboto'],
      default: 'Inter'
    }
  ]
};
