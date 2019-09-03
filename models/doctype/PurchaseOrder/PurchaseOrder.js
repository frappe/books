const model = require('frappejs/model');
const PurchaseInvoice = require('../PurchaseInvoice/PurchaseInvoice');

module.exports = model.extend(
  PurchaseInvoice,
  {
    name: 'PurchaseOrder',
    label: 'Purchase Order',
    settings: 'PurchaseOrderSettings',
    fields: [
      {
        fieldname: 'items',
        childtype: 'PurchaseOrderItem'
      }
    ]
  },
  {
    skipFields: ['account']
  }
);
