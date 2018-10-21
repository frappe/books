const frappe = require('frappejs');
const BaseDocument = require('frappejs/model/document');
const Balance = require('../../../reports/StockLedger/Balance.js');
const balance = new Balance();

module.exports = class StockEntry extends BaseDocument {
    async validate() {
        let seItems = this.items;
        let entryName = this.name;
        await Promise.all(seItems.map(async function (item) {
            let { itemName, quantity, sourceWarehouse, targetWarehouse } = item;
            if(sourceWarehouse == targetWarehouse){
                alert('Source and Target Warehouse cannot be the same');
                throw new frappe.errors.ValidationError('Source and Target Warehouse cannot be the same');
            }
            if(sourceWarehouse){
                if (quantity > await balance.getBalance(sourceWarehouse, itemName, entryName)) {
                    alert(`Insufficient quantity for item "${itemName}" in warehouse "${sourceWarehouse}"`);
                    throw new frappe.errors.ValidationError(`Insufficient quantity for item "${itemName}" in warehouse "${sourceWarehouse}"`);
                }
            }
        }));
    }
}