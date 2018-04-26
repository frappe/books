const frappe = require('frappejs');

class PurchaseRegister {
    async run({ fromDate, toDate }) {
        const bills = await frappe.db.getAll({
            doctype: 'Bill',
            fields: ['name', 'date', 'supplier', 'account', 'netTotal', 'grandTotal'],
            filters: {
                date: ['>=', fromDate, '<=', toDate],
                submitted: 1
            },
            orderBy: 'date',
            order: 'desc'
        });

        const billNames = bills.map(d => d.name);

        const taxes = await frappe.db.getAll({
            doctype: 'TaxSummary',
            fields: ['parent', 'amount'],
            filters: {
                parenttype: 'Bill',
                parent: ['in', billNames]
            },
            orderBy: 'name'
        });

        for (let bill of bills) {
            bill.totalTax = taxes
                .filter(tax => tax.parent === bill.name)
                .reduce((acc, tax) => {
                    if (tax.amount) {
                        acc = acc + tax.amount;
                    }
                    return acc;
                }, 0);
        }

        return { rows: bills };
    }
}

module.exports = PurchaseRegister;
