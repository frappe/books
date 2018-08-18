module.exports = {
  name: 'File',
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: [
    'name',
    'filename'
  ],
  fields: [
    {
      fieldname: 'name',
      label: 'File Path',
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'filename',
      label: 'File Name',
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'mimetype',
      label: 'MIME Type',
      fieldtype: 'Data',
    },
    {
      fieldname: 'size',
      label: 'File Size',
      fieldtype: 'Int',
    },
    {
      fieldname: 'referenceDoctype',
      label: 'Reference DocType',
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceName',
      label: 'Reference Name',
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceField',
      label: 'Reference Field',
      fieldtype: 'Data',
    },
  ],
  layout: [
    {
      columns: [
        { fields: ['filename'] },
      ]
    },
    {
      columns: [
        { fields: ['mimetype'] },
        { fields: ['size'] },
      ]
    },
    {
      columns: [
        { fields: ['referenceDoctype'] },
        { fields: ['referenceName'] },
      ]
    },
  ]
}