import BaseDocument from 'frappejs/model/document';
import frappe from 'frappejs';
import format from './GSTR3BFormat';

export default class GSTR3B extends BaseDocument {
  async getData() {
    const monthIndex = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ].indexOf(this.month);
    const month = monthIndex + 1 > 9 ? monthIndex + 1 : `0${monthIndex + 1}`;
    const lastDate = new Date(this.year, monthIndex + 1, 0).getDate();
    const filters = {
      date: [
        '>=',
        `${this.year}-${month}-01`,
        '<=',
        `${this.year}-${month}-${lastDate}`
      ]
    };
    const salesInvoices = frappe.db.getAll({
      doctype: 'SalesInvoice',
      filters,
      fields: ['*']
    });
    const purchaseInvoices = frappe.db.getAll({
      doctype: 'PurchaseInvoice',
      filters,
      fields: ['*']
    });
    const [gstr1Data, gstr2Data] = await Promise.all([
      salesInvoices,
      purchaseInvoices
    ]);
    let gstr3bData = [[], []];

    for (let ledgerEntry of gstr1Data) {
      ledgerEntry.doctype = 'SalesInvoice';
      gstr3bData[0].push(await this.makeGSTRow(ledgerEntry));
    }
    for (let ledgerEntry of gstr2Data) {
      ledgerEntry.doctype = 'PurchaseInvoice';
      gstr3bData[1].push(await this.makeGSTRow(ledgerEntry));
    }

    return gstr3bData;
  }

  async makeGSTRow(ledgerEntry) {
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

  async createJson(data) {
    let jsonData = JSON.parse(JSON.stringify(format));

    for (let ledgerEntry of data[0]) {
      if (ledgerEntry.rate > 0) {
        jsonData['sup_details']['osup_det']['samt'] += ledgerEntry.sgstAmt || 0;
        jsonData['sup_details']['osup_det']['camt'] += ledgerEntry.cgstAmt || 0;
        jsonData['sup_details']['osup_det']['iamt'] += ledgerEntry.igstAmt || 0;
        jsonData['sup_details']['osup_det']['txval'] += ledgerEntry.taxVal;
      }
      if (ledgerEntry.rate === 0) {
        jsonData['sup_details']['osup_zero']['txval'] += ledgerEntry.taxVal;
      }
      if (ledgerEntry.nilRated || ledgerEntry.exempt) {
        jsonData['sup_details']['osup_nil_exmp']['txval'] += ledgerEntry.taxVal;
      }
      if (ledgerEntry.nonGST) {
        jsonData['sup_details']['osup_nongst']['txval'] += ledgerEntry.taxVal;
      }
      if (!ledgerEntry.inState && !ledgerEntry.gstin) {
        jsonData['inter_sup']['unreg_details'].push({
          pos: ledgerEntry.place,
          txval: ledgerEntry.taxVal,
          iAmt: ledgerEntry.igstAmt || 0
        });
      }
    }

    for (let ledgerEntry of data[1]) {
      if (ledgerEntry.reverseCharge === 'Y') {
        jsonData['sup_details']['isup_rev']['samt'] += ledgerEntry.sgstAmt || 0;
        jsonData['sup_details']['isup_rev']['camt'] += ledgerEntry.cgstAmt || 0;
        jsonData['sup_details']['isup_rev']['iamt'] += ledgerEntry.igstAmt || 0;
        jsonData['sup_details']['isup_rev']['txval'] += ledgerEntry.taxVal;
      }
      if (ledgerEntry.nilRated || ledgerEntry.exempt) {
        jsonData['inward_sup']['isup_details'][0][
          ledgerEntry.inState ? 'intra' : 'inter'
        ] += ledgerEntry.taxVal;
      }
      if (ledgerEntry.nonGST) {
        jsonData['inward_sup']['isup_details'][0][
          ledgerEntry.inState ? 'intra' : 'inter'
        ] += ledgerEntry.taxVal;
      }
    }

    return jsonData;
  }

  async getJson() {
    if (this.year && this.month) {
      const data = await this.getData();
      const json = await this.createJson(data);
      return JSON.stringify(json, undefined, 2);
    }
  }
};
