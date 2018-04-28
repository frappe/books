const model = require('frappejs/model');
const BillItem = require('../BillItem/BillItem');

module.exports = model.extend(BillItem, {
    name: "PurchaseOrderItem"
});
