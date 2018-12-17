const frappe = require('frappejs');

class GoodsAndServiceTax {
  async run(params) {
    const filters = {};
    // if (params.account) filters.paymentAccount = params.account;
    // if (params.party) filters.party = params.party;
    // if (params.referenceType) filters.referenceType = params.referenceType;
    // if (params.referenceName) filters.referenceName = params.referenceName;
    // if (params.toDate || params.fromDate) {
    //   filters.date = [];
    //   if (params.toDate) filters.date.push('<=', params.toDate);
    //   if (params.fromDate) filters.date.push('>=', params.fromDate);
    // }
    if (params.name) filters.name = params.name;

    let invoiceNames = await frappe.db.getAll({
      doctype: 'Invoice',
      filters: {}
    });

    let tableData = [];

    for (let [pos, invoice] of invoiceNames.entries()) {
      const row = {}
      let invoiceDetails = await frappe.getDoc('Invoice', invoice.name);
      let customerDetails = await frappe.getDoc('Party', invoiceDetails.customer)
      let addressDetails = await frappe.getDoc('Address', customerDetails.address)
      row.gstin = customerDetails.gstin
      row.cusName = invoiceDetails.customer
      row.invNo = invoiceDetails.name
      row.invDate = invoiceDetails.date
      row.place = addressDetails.state
      row.rate = 0
      invoiceDetails.taxes.forEach(tax => {
        row.rate += tax.rate
      });
      row.invAmt = invoiceDetails.netTotal
      row.taxAmt = parseInt(invoiceDetails.grandTotal) - parseInt(invoiceDetails.netTotal)
      tableData.push(row)
    }

    return tableData;
  }
  
}

module.exports = GoodsAndServiceTax;
