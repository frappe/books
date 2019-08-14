module.exports = {
  name: 'PaymentFor',
  label: 'Payment For',
  isSingle: 0,
  isChild: 1,
  keywordFields: [],
  fields: [
    {
      fieldname: 'referenceType',
      label: 'Reference Type',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'referenceName',
      label: 'Reference Name',
      fieldtype: 'DynamicLink',
      references: 'referenceType',
      required: 1
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      formula: (row, doc) => {
        doc.getFrom(doc.referenceType, doc.referenceName, 'grandTotal');
      },
      required: 1
    }
  ]
};
