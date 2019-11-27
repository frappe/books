const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');
const { getExchangeRate } = require('../../../accounting/exchangeRate');

module.exports = class SalesInvoice extends BaseDocument {
  async setup() {
    this.accountingSettings = await frappe.getSingle('AccountingSettings');

    this.onChange({
      async customer() {
        if (this.customer) {
          this.currency = await frappe.db.getValue('Party', this.customer, 'currency');
          this.exchangeRate = await this.getExchangeRate();
        }
      },
      async currency() {
        this.exchangeRate = await this.getExchangeRate();
      }
    });
  }

  async getExchangeRate() {
    const companyCurrency = this.accountingSettings.currency;
    if (this.currency === companyCurrency) {
      return 1.0;
    }
    return await getExchangeRate({
      fromCurrency: this.currency,
      toCurrency: companyCurrency
    });
  }

  async getRowTax(row) {
    if (row.tax) {
      let tax = await this.getTax(row.tax);
      let taxAmount = [];
      for (let d of tax.details || []) {
        let amount = (row.amount * d.rate) / 100
        taxAmount.push({
          account: d.account,
          rate: d.rate,
          amount,
          baseAmount: amount * this.exchangeRate,
        });
      }
      return JSON.stringify(taxAmount);
    } else {
      return '';
    }
  }

  async getTax(tax) {
    if (!this._taxes) this._taxes = {};
    if (!this._taxes[tax]) this._taxes[tax] = await frappe.getDoc('Tax', tax);
    return this._taxes[tax];
  }

  async makeTaxSummary() {
    if (!this.taxes) this.taxes = [];

    // reset tax amount
    this.taxes.map(d => {
      d.amount = 0;
      d.rate = 0;
      d.baseAmount = 0;
    });

    // calculate taxes
    for (let row of this.items) {
      if (row.taxAmount) {
        let taxAmount = JSON.parse(row.taxAmount);
        for (let rowTaxDetail of taxAmount) {
          let found = false;

          // check if added in summary
          for (let taxDetail of this.taxes) {
            if (taxDetail.account === rowTaxDetail.account) {
              taxDetail.rate = rowTaxDetail.rate;
              taxDetail.amount = taxDetail.amount + rowTaxDetail.amount;
              taxDetail.baseAmount = taxDetail.baseAmount + rowTaxDetail.baseAmount;
              found = true;
            }
          }

          // add new row
          if (!found) {
            this.taxes.push({
              account: rowTaxDetail.account,
              rate: rowTaxDetail.rate,
              amount: rowTaxDetail.amount,
              baseAmount: rowTaxDetail.baseAmount
            });
          }
        }
      }
    }

    // clear no taxes
    this.taxes = this.taxes.filter(d => d.amount);
  }

  async getGrandTotal() {
    await this.makeTaxSummary();
    let grandTotal = this.netTotal;
    if (this.taxes) {
      for (let row of this.taxes) {
        grandTotal += row.amount;
      }
    }

    return grandTotal;
  }
};
