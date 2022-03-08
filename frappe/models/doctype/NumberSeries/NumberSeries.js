const { t } = require('frappe');

const referenceTypeMap = {
  SalesInvoice: t`Invoice`,
  PurchaseInvoice: t`Bill`,
  Payment: t`Payment`,
  JournalEntry: t`Journal Entry`,
  Quotation: t`Quotation`,
  SalesOrder: t`SalesOrder`,
  Fulfillment: t`Fulfillment`,
  PurchaseOrder: t`PurchaseOrder`,
  PurchaseReceipt: t`PurchaseReceipt`,
  '-': t`None`,
};

module.exports = {
  name: 'NumberSeries',
  documentClass: require('./NumberSeriesDocument.js'),
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'name',
      label: t`Prefix`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'start',
      label: t`Start`,
      fieldtype: 'Int',
      default: 1001,
      required: 1,
    },
    {
      fieldname: 'padZeros',
      label: t`Pad Zeros`,
      fieldtype: 'Int',
      default: 4,
      required: 1,
    },
    {
      fieldname: 'referenceType',
      label: t`Reference Type`,
      fieldtype: 'Select',
      options: Object.keys(referenceTypeMap),
      map: referenceTypeMap,
      default: '-',
      required: 1,
      readOnly: 1,
    },
    {
      fieldname: 'current',
      label: t`Current`,
      fieldtype: 'Int',
      required: 1,
      readOnly: 1,
    },
  ],
  quickEditFields: ['start', 'padZeros', 'referenceType'],
};
