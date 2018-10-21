const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');

module.exports = class SalesOrder extends BaseDocument {

    async validate() {
        function count(arr, el) {
            return arr.reduce(function (acc, i){
                if(i === el)
                    return acc + 1;
            },0)
        }
        let soItems = this.items;
        let itemNames = soItems.map((i)=>i.item);
        for(let i of itemNames) {
            if(count(itemNames, i) > 1){
                 alert(`Duplicate Entries of item "${i}" found`);
                 throw new frappe.errors.ValidationError(`Duplicate Entries of item "${i}" found`);
            }
        }
    }

}