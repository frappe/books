import frappe from 'frappe';
import BaseDocument from 'frappe/model/document';
import { getExchangeRate } from '../../../accounting/exchangeRate';

export default class TransactionDocument extends BaseDocument {
  async getExchangeRate() {
    if (!this.currency) return 1.0;

    let accountingSettings = await frappe.getSingle('AccountingSettings');
    const companyCurrency = accountingSettings.currency;
    if (this.currency === companyCurrency) {
      return 1.0;
    }
    return await getExchangeRate({
      fromCurrency: this.currency,
      toCurrency: companyCurrency,
    });
  }

  async getTaxSummary() {
    let taxes = {};

    for (let row of this.items) {
      if (!row.tax) {
        continue;
      }

      const tax = await this.getTax(row.tax);
      for (let d of tax.details) {
        taxes[d.account] = taxes[d.account] || {
          account: d.account,
          rate: d.rate,
          amount: frappe.pesa(0),
        };

        const amount = row.amount.mul(d.rate).div(100);
        taxes[d.account].amount = taxes[d.account].amount.add(amount);
      }
    }

    return Object.keys(taxes)
      .map((account) => {
        const tax = taxes[account];
        tax.baseAmount = tax.amount.mul(this.exchangeRate);
        return tax;
      })
      .filter((tax) => !tax.amount.isZero());
  }

  async getTax(tax) {
    if (!this._taxes) this._taxes = {};
    if (!this._taxes[tax]) this._taxes[tax] = await frappe.getDoc('Tax', tax);
    return this._taxes[tax];
  }

  async getGrandTotal() {
    return (this.taxes || [])
      .map(({ amount }) => amount)
      .reduce((a, b) => a.add(b), this.netTotal);
  }
}
