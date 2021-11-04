export default {
  name: 'PurchaseInvoiceSettings',
  label: 'Purchase Invoice Settings',
  doctype: 'DocType',
  isSingle: 1,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'numberSeries',
      label: 'Number Series',
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      default: 'PINV'
    }
  ]
};
