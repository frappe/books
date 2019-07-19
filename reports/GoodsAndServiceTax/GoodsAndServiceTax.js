const frappe = require('frappejs');

class GoodsAndServiceTax {
  async run(params) {
    let filters = {};
    if (params.toDate || params.fromDate) {
      filters.date = [];
      if (params.toDate) filters.date.push('<=', params.toDate);
      if (params.fromDate) filters.date.push('>=', params.fromDate);
    }
    if (params.transferType) filters.transferType = params.transferType;

    let invoiceNames = await frappe.db.getAll({
      doctype: 'Invoice',
      filter: filters
    });

    let tableData = [];
    for (let invoice of invoiceNames) {
      const row = await this.getRow(invoice.name);
      tableData.push(row);
    }

    if (Object.keys(filters).length != 0) {
      tableData = tableData.filter(row => {
        if (filters.account) return row.account === filters.account;
        if (filters.transferType)
          return row.transferType === filters.transferType;
        if (filters.place) return row.place === filters.place;
        return true;
      });
    }

    return tableData;
  }

  async getRow(invoiceName) {
    let row = {};
    let invoiceDetails = await frappe.getDoc('Invoice', invoiceName);
    let customerDetails = await frappe.getDoc('Party', invoiceDetails.customer);
    if (customerDetails.address) {
      let addressDetails = await frappe.getDoc(
        'Address',
        customerDetails.address
      );
      row.place = addressDetails.state || '';
    }
    row.gstin = customerDetails.gstin;
    row.cusName = invoiceDetails.customer;
    row.invNo = invoiceDetails.name;
    row.invDate = invoiceDetails.date;

    row.rate = 0;
    row.transferType = 'In State';
    invoiceDetails.taxes.forEach(tax => {
      row.rate += tax.rate;
      const taxAmt = (tax.rate * invoiceDetails.netTotal) / 100;
      if (tax.account === 'IGST') {
        row.transferType = 'Out of State';
        row.igstAmt = taxAmt;
      }
      if (tax.account === 'CGST') row.cgstAmt = taxAmt;
      if (tax.account === 'SGST') row.sgstAmt = taxAmt;
    });
    row.invAmt = invoiceDetails.grandTotal;
    row.taxAmt = invoiceDetails.netTotal;
    return row;
  }
}

module.exports = GoodsAndServiceTax;
