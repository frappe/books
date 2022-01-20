import frappe from 'frappe';
import { stateCodeMap } from '../../accounting/gst';
import { convertPesaValuesToFloat } from '../../src/utils';

class BaseGSTR {
  async getCompleteReport(gstrType, filters) {
    if (['GSTR-1', 'GSTR-2'].includes(gstrType)) {
      const place = filters.place;
      delete filters.place;
      let entries = await frappe.db.getAll({
        doctype: gstrType === 'GSTR-1' ? 'SalesInvoice' : 'PurchaseInvoice',
        filters,
      });
      filters.place = place;

      let tableData = [];
      for (let entry of entries) {
        entry.doctype =
          gstrType === 'GSTR-1' ? 'SalesInvoice' : 'PurchaseInvoice';
        const row = await this.getRow(entry);
        tableData.push(row);
      }

      if (Object.keys(filters).length != 0) {
        tableData = tableData.filter((row) => {
          if (filters.account) return row.account === filters.account;
          if (filters.transferType)
            return row.transferType === filters.transferType;
          if (filters.place) return row.place === filters.place;
          return true;
        });
      }

      tableData.forEach(convertPesaValuesToFloat);
      return tableData;
    } else {
      return [];
    }
  }

  async getRow(ledgerEntry) {
    ledgerEntry = await frappe.getDoc(ledgerEntry.doctype, ledgerEntry.name);

    const row = {};
    const { gstin } = frappe.AccountingSettings;

    let party = await frappe.getDoc(
      'Party',
      ledgerEntry.customer || ledgerEntry.supplier
    );

    if (party.address) {
      let addressDetails = await frappe.getDoc('Address', party.address);
      row.place = addressDetails.pos || '';
    }

    row.gstin = party.gstin;
    row.partyName = ledgerEntry.customer || ledgerEntry.supplier;
    row.invNo = ledgerEntry.name;
    row.invDate = ledgerEntry.date;
    row.rate = 0;
    row.inState =
      gstin && gstin.substring(0, 2) === stateCodeMap[row.place?.toUpperCase()];
    row.reverseCharge = !party.gstin ? 'Y' : 'N';

    ledgerEntry.taxes?.forEach((tax) => {
      row.rate += tax.rate;
      const taxAmt = ledgerEntry.netTotal.percent(tax.rate);

      switch (tax.account) {
        case 'IGST': {
          row.igstAmt = taxAmt;
          row.inState = false;
        }
        case 'CGST':
          row.cgstAmt = taxAmt;
        case 'SGST':
          row.sgstAmt = taxAmt;
        case 'Nil Rated':
          row.nilRated = true;
        case 'Exempt':
          row.exempt = true;
        case 'Non GST':
          row.nonGST = true;
      }
    });

    row.invAmt = ledgerEntry.grandTotal;
    row.taxVal = ledgerEntry.netTotal;

    return row;
  }
}

export default BaseGSTR;
