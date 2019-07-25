const frappe = require('frappejs');

class GoodsAndServiceTax {
  async run(params) {
    let filters = {};
    if (params.toDate || params.fromDate) {
      filters.date = [];
      if (params.toDate) filters.date.push('<=', params.toDate);
      if (params.fromDate) filters.date.push('>=', params.fromDate);
    }

    if (params.reportType === 'GSTR-3B') {
      this.getGSTR3bJson(filters);
      return [];
    }

    const data = await this.getCompleteReport(params.reportType, filters);

    const conditions = {
      B2B: row => row.gstin,
      'B2C-Large': row => !row.gstin && !row.inState && row.invAmt >= 250000,
      'B2C-Small': row =>
        !row.gstin && (row.inState || (row.inState && row.invAmt < 250000))
    };

    if (!params.transferType) return data;
    return data.filter(row => conditions[params.transferType](row));
  }

  async getCompleteReport(gstrType, filters) {
    if (['GSTR-1', 'GSTR-2'].includes(gstrType)) {
      let entries = await frappe.db.getAll({
        doctype: gstrType === 'GSTR-1' ? 'Invoice' : 'Bill',
        filter: filters
      });

      let tableData = [];
      for (let entry of entries) {
        const row = await this.getRow({
          doctype: gstrType === 'GSTR-1' ? 'Invoice' : 'Bill',
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

  async getGSTR3bJson(filters) {
    const gstr1Data = this.getCompleteReport('GSTR-1', filters);
    const gsrt2Data = this.getCompleteReport('GSTR-2', filters);
    const gstr3bData = await Promise.all([gstr1Data, gsrt2Data]);

    let gstr3bJson = require('./gstr3b.json');

    for (let entry of gstr3bData[0]) {
      if (entry.rate > 0) {
        gstr3bJson['sup_details']['osup_det']['samt'] += entry.sgstAmt || 0;
        gstr3bJson['sup_details']['osup_det']['camt'] += entry.cgstAmt || 0;
        gstr3bJson['sup_details']['osup_det']['iamt'] += entry.igstAmt || 0;
        gstr3bJson['sup_details']['osup_det']['txval'] += entry.taxVal;
      }
      if (entry.rate === 0) {
        gstr3bJson['sup_details']['osup_zero']['txval'] += entry.taxVal;
      }
      if (entry.nilRated || entry.exempt) {
        gstr3bJson['sup_details']['osup_nil_exmp']['txval'] += entry.taxVal;
      }
      if (entry.nonGST) {
        gstr3bJson['sup_details']['osup_nongst']['txval'] += entry.taxVal;
      }
      if (!entry.inState && !entry.gstin) {
        gstr3bJson['inter_sup']['unreg_details'].push = {
          place: entry.place,
          taxVal: entry.taxVal,
          igstAmt: entry.igstAmt
        };
      }
    }

    for (let entry of gstr3bData[1]) {
      if (entry.reverseCharge === 'Y') {
        gstr3bJson['sup_details']['isup_rev']['samt'] += entry.sgstAmt || 0;
        gstr3bJson['sup_details']['isup_rev']['camt'] += entry.cgstAmt || 0;
        gstr3bJson['sup_details']['isup_rev']['iamt'] += entry.igstAmt || 0;
        gstr3bJson['sup_details']['isup_rev']['txval'] += entry.taxVal;
      }
      if (entry.nilRated || entry.exempt) {
        gstr3bJson['inward_sup']['isup_details'][0][
          entry.inState ? 'intra' : 'inter'
        ] += entry.taxVal;
      }
      if (entry.nonGST) {
        gstr3bJson['inward_sup']['isup_details'][0][
          entry.inState ? 'intra' : 'inter'
        ] += entry.taxVal;
      }
    }

    return gstr3bJson;
  }

  async getRow(entry) {
    let row = {};
    let entryDetails = await frappe.getDoc(entry.doctype, entry.name);
    let party = await frappe.getDoc(
      'Party',
      entryDetails.customer || entryDetails.supplier
    );
    if (party.address) {
      let addressDetails = await frappe.getDoc('Address', party.address);
      row.place = addressDetails.state || '';
    }
    row.gstin = party.gstin;
    row.partyName = entryDetails.customer || entryDetails.supplier;
    row.invNo = entryDetails.name;
    row.invDate = entryDetails.date;
    row.rate = 0;
    row.inState = true;
    row.reverseCharge = !party.gstin ? 'Y' : 'N';
    entryDetails.taxes.forEach(tax => {
      row.rate += tax.rate;
      const taxAmt = (tax.rate * entryDetails.netTotal) / 100;
      if (tax.account === 'IGST') row.igstAmt = taxAmt;
      if (tax.account === 'IGST') row.inState = false;
      if (tax.account === 'CGST') row.cgstAmt = taxAmt;
      if (tax.account === 'SGST') row.sgstAmt = taxAmt;
      if (tax.account === 'Nil Rated') row.nilRated = true;
      if (tax.account === 'Exempt') row.exempt = true;
      if (tax.account === 'Non GST') row.nonGST = true;
    });
    row.invAmt = entryDetails.grandTotal;
    row.taxVal = entryDetails.netTotal;
    return row;
  }
}

module.exports = GoodsAndServiceTax;
