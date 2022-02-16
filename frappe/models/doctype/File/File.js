const { t } = require('frappe');

module.exports = {
  name: 'File',
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: ['name', 'filename'],
  fields: [
    {
      fieldname: 'name',
      label: t`File Path`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'filename',
      label: t`File Name`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'mimetype',
      label: t`MIME Type`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'size',
      label: t`File Size`,
      fieldtype: 'Int',
    },
    {
      fieldname: 'referenceDoctype',
      label: t`Reference DocType`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceName',
      label: t`Reference Name`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceField',
      label: t`Reference Field`,
      fieldtype: 'Data',
    },
  ],
  layout: [
    {
      columns: [{ fields: ['filename'] }],
    },
    {
      columns: [{ fields: ['mimetype'] }, { fields: ['size'] }],
    },
    {
      columns: [
        { fields: ['referenceDoctype'] },
        { fields: ['referenceName'] },
      ],
    },
  ],
};
