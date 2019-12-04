const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');
const { round } = require('frappejs/utils/numberFormat');
const { getExchangeRate } = require('../../../accounting/exchangeRate');

module.exports = class TransactionDocument extends BaseDocument {
  async getExchangeRate() {
    if (!this.currency) return;

    let accountingSettings = await frappe.getSingle('AccountingSettings');
    const companyCurrency = accountingSettings.currency;
    if (this.currency === companyCurrency) {
      return 1.0;
    }
    return await getExchangeRate({
      fromCurrency: this.currency,
      toCurrency: companyCurrency
    });
  }

  async getTaxSummary() {
    let taxes = {};

    for (let row of this.items) {
      if (row.tax) {
        let tax = await this.getTax(row.tax);
        for (let d of tax.details) {
          let amount = (row.amount * d.rate) / 100;
          taxes[d.account] = taxes[d.account] || {
            account: d.account,
            rate: d.rate,
            amount: 0
          };
          // collect amount
          taxes[d.account].amount += amount;
        }
      }
    }

    return (
      Object.keys(taxes)
        .map(account => {
          let tax = taxes[account];
          tax.baseAmount = round(tax.amount * this.exchangeRate, 2);
          return tax;
        })
        // clear rows with 0 amount
        .filter(tax => tax.amount)
    );
  }

  async getTax(tax) {
    if (!this._taxes) this._taxes = {};
    if (!this._taxes[tax]) this._taxes[tax] = await frappe.getDoc('Tax', tax);
    return this._taxes[tax];
  }

  async getGrandTotal() {
    let grandTotal = this.netTotal;
    if (this.taxes) {
      for (let row of this.taxes) {
        grandTotal += row.amount;
      }
    }

    return grandTotal;
  }
};
