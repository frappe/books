const frappe = require('frappejs');

class BaseGSTR {
  async getCompleteReport(gstrType, filters) {
    if (['GSTR-1', 'GSTR-2'].includes(gstrType)) {
      let entries = await frappe.db.getAll({
        doctype: gstrType === 'GSTR-1' ? 'SalesInvoice' : 'PurchaseInvoice',
        filters
      });

      let tableData = [];
      for (let entry of entries) {
        entry.doctype = gstrType === 'GSTR-1' ? 'SalesInvoice' : 'PurchaseInvoice';
        const row = await this.getRow(entry);
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

  async getRow(ledgerEntry) {
    let row = {};
    ledgerEntry = await frappe.getDoc(ledgerEntry.doctype, ledgerEntry.name);
    let party = await frappe.getDoc(
      'Party',
      ledgerEntry.customer || ledgerEntry.supplier
    );
    if (party.address) {
      let addressDetails = await frappe.getDoc('Address', party.address);
      row.place = addressDetails.state || '';
    }
    row.gstin = party.gstin;
    row.partyName = ledgerEntry.customer || ledgerEntry.supplier;
    row.invNo = ledgerEntry.name;
    row.invDate = ledgerEntry.date;
    row.rate = 0;
    row.inState = true;
    row.reverseCharge = !party.gstin ? 'Y' : 'N';
    ledgerEntry.taxes.forEach(tax => {
      row.rate += tax.rate;
      const taxAmt = (tax.rate * ledgerEntry.netTotal) / 100;
      if (tax.account === 'IGST') row.igstAmt = taxAmt;
      if (tax.account === 'IGST') row.inState = false;
      if (tax.account === 'CGST') row.cgstAmt = taxAmt;
      if (tax.account === 'SGST') row.sgstAmt = taxAmt;
      if (tax.account === 'Nil Rated') row.nilRated = true;
      if (tax.account === 'Exempt') row.exempt = true;
      if (tax.account === 'Non GST') row.nonGST = true;
    });
    row.invAmt = ledgerEntry.grandTotal;
    row.taxVal = ledgerEntry.netTotal;
    return row;
  }
}

module.exports = BaseGSTR;
