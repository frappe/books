export default {
  name: 'PaymentFor',
  label: 'Payment For',
  isSingle: 0,
  isChild: 1,
  keywordFields: [],
  tableFields: [
    'referenceType',
    'referenceName',
    'amount'
  ],
  fields: [
    {
      fieldname: 'referenceType',
      label: 'Reference Type',
      fieldtype: 'AutoComplete',
      options: ['SalesInvoice', 'PurchaseInvoice'],
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
        return doc.getFrom(row.referenceType, row.referenceName, 'outstandingAmount');
      },
      required: 1
    }
  ]
};
