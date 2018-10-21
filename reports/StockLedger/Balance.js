const frappe = require('frappejs');

module.exports = class Balance {
    computeBalance(additions, deletions) {
        let add = 0;
        let del = 0;
        if (additions.length !== 0) {
            additions.forEach(function (item) {
                add += item.quantity;
            });
        }
        if (deletions.length !== 0) {
            deletions.forEach(function (item) {
                del -= item.quantity;
            });
        }
        return add + del;
    }

    async getAdditions(whName, itemName, parentid) {
        return await frappe.db.getAll({
            doctype: 'StockEntryItem',
            fields: ['quantity'],
            orderBy: 'idx',
            order: 'desc',
            filters: {
                targetWarehouse: whName,
                itemName: itemName,
                parent: ['<=', parentid]
            }
        });
    }

    async getDeletions(whName, itemName, parentid) {
        return await frappe.db.getAll({
            doctype: 'StockEntryItem',
            fields: ['quantity'],
            orderBy: 'idx',
            order: 'desc',
            filters: {
                sourceWarehouse: whName,
                itemName: itemName,
                parent: ['<=', parentid]
            }
        });
    }

    async getBalance(whName, itemName, parentid) {
        let additions = await this.getAdditions(whName, itemName, parentid);
        let deletions = await this.getDeletions(whName, itemName, parentid);
        return this.computeBalance(additions, deletions);
    }
}