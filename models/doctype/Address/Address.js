export default {
  name: 'Address',
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: [
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'country',
    'postalCode'
  ],
  fields: [
    {
      fieldname: 'addressLine1',
      label: 'Address Line 1',
      placeholder: 'Address Line 1',
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'addressLine2',
      label: 'Address Line 2',
      placeholder: 'Address Line 2',
      fieldtype: 'Data'
    },
    {
      fieldname: 'city',
      label: 'City / Town',
      placeholder: 'City / Town',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'state',
      label: 'State',
      placeholder: 'State',
      fieldtype: 'Data'
    },
    {
      fieldname: 'country',
      label: 'Country',
      placeholder: 'Country',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'postalCode',
      label: 'Postal Code',
      placeholder: 'Postal Code',
      fieldtype: 'Data'
    },
    {
      fieldname: 'emailAddress',
      label: 'Email Address',
      placeholder: 'Email Address',
      fieldtype: 'Data'
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      placeholder: 'Phone',
      fieldtype: 'Data'
    },
    {
      fieldname: 'fax',
      label: 'Fax',
      fieldtype: 'Data'
    },
    {
      fieldname: 'addressDisplay',
      fieldtype: 'Text',
      label: 'Address Display',
      readOnly: true,
      formula: doc => {
        return [
          doc.addressLine1,
          doc.addressLine2,
          doc.city,
          doc.state,
          doc.country,
          doc.postalCode
        ]
          .filter(Boolean)
          .join(', ');
      }
    }
  ],
  quickEditFields: [
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'country',
    'postalCode'
  ],
  inlineEditDisplayField: 'addressDisplay'
};
