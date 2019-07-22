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

    const data = await this.getReport(params.reportType, filters);
    return data;
  }

  async getReport(type, filters) {
    if (['GSTR-1', 'GSTR-2'].includes(type)) {
      let entries = await frappe.db.getAll({
        doctype: type === 'GSTR-1' ? 'Invoice' : 'Bill',
        filter: filters
      });

      let tableData = [];
      for (let entry of entries) {
        const row = await this.getRow({
          doctype: type === 'GSTR-1' ? 'Invoice' : 'Bill',
          name: entry.name
        });
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
    } else {
      return [];
    }
  }

  async getRow(entry) {
    let row = {};
    let entryDetails = await frappe.getDoc(entry.doctype, entry.name);
    let customerDetails = await frappe.getDoc(
      'Party',
      entryDetails.customer || entryDetails.supplier
    );
    if (customerDetails.address) {
      let addressDetails = await frappe.getDoc(
        'Address',
        customerDetails.address
      );
      row.place = addressDetails.state || '';
    }
    row.gstin = customerDetails.gstin;
    row.partyName = entryDetails.customer || entryDetails.supplier;
    row.invNo = entryDetails.name;
    row.invDate = entryDetails.date;

    row.rate = 0;
    row.transferType = 'In State';
    entryDetails.taxes.forEach(tax => {
      row.rate += tax.rate;
      const taxAmt = (tax.rate * entryDetails.netTotal) / 100;
      if (tax.account === 'IGST') {
        row.transferType = 'Out of State';
        row.igstAmt = taxAmt;
      }
      if (tax.account === 'CGST') row.cgstAmt = taxAmt;
      if (tax.account === 'SGST') row.sgstAmt = taxAmt;
    });
    row.invAmt = entryDetails.grandTotal;
    row.taxAmt = entryDetails.netTotal;
    return row;
  }
}

module.exports = GoodsAndServiceTax;
