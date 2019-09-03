const frappe = require('frappejs');

class SalesRegister {
  async run({ fromDate, toDate, customer }) {
    if (!fromDate && !toDate && !customer) return { rows: [] };

    let filters = {};
    if (customer) {
      filters.customer = customer;
    }

    if (fromDate && toDate) {
      filters.date = ['>=', fromDate, '<=', toDate];
    } else if (fromDate) {
      filters.date = ['>=', fromDate];
    } else if (toDate) {
      filters.date = ['<=', toDate];
    }

    const invoices = await frappe.db.getAll({
      doctype: 'SalesInvoice',
      fields: ['name', 'date', 'customer', 'account', 'netTotal', 'grandTotal'],
      filters: filters,
      orderBy: 'date',
      order: 'desc'
    });

    const invoiceNames = invoices.map(d => d.name);

    const taxes = await frappe.db.getAll({
      doctype: 'TaxSummary',
      fields: ['parent', 'amount'],
      filters: {
        parenttype: 'Invoice',
        parent: ['in', invoiceNames]
      },
      orderBy: 'name'
    });

    for (let invoice of invoices) {
      invoice.totalTax = taxes
        .filter(tax => tax.parent === invoice.name)
        .reduce((acc, tax) => {
          if (tax.amount) {
            acc = acc + tax.amount;
          }
          return acc;
        }, 0);
    }

    return { rows: invoices };
  }
}

module.exports = SalesRegister;
