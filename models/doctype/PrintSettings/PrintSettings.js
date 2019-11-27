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
      fieldtype: 'Data',
      placeholder: 'john@doe.com'
    },
    {
      fieldname: 'displayLogo',
      label: 'Display Logo in Invoice',
      fieldtype: 'Check'
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      fieldtype: 'Data',
      placeholder: '9888900000'
    },
    {
      fieldname: 'address',
      label: 'Address',
      fieldtype: 'Link',
      target: 'Address',
      placeholder: 'Click to create',
      inline: true
    },
    {
      fieldname: 'gstin',
      label: 'GSTIN',
      fieldtype: 'Data',
      placeholder: '27AAAAA0000A1Z5',
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
