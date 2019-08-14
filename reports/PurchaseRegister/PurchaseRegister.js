const frappe = require('frappejs');

class PurchaseRegister {
  async run({ fromDate, toDate, supplier }) {
    if (!fromDate && !toDate && !supplier) return { rows: [] };

    let filters = {};
    if (supplier) {
      filters.supplier = supplier;
    }

    if (fromDate && toDate) {
      filters.date = ['>=', fromDate, '<=', toDate];
    } else if (fromDate) {
      filters.date = ['>=', fromDate];
    } else if (toDate) {
      filters.date = ['<=', toDate];
    }
    filters.submitted = 1;

    const bills = await frappe.db.getAll({
      doctype: 'PurchaseInvoice',
      fields: ['name', 'date', 'supplier', 'account', 'netTotal', 'grandTotal'],
      filters,
      orderBy: 'date',
      order: 'desc'
    });

    const billNames = bills.map(d => d.name);

    const taxes = await frappe.db.getAll({
      doctype: 'TaxSummary',
      fields: ['parent', 'amount'],
      filters: {
        parenttype: 'PurchaseInvoice',
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
