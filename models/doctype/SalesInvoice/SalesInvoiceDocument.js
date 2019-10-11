const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');

module.exports = class SalesInvoice extends BaseDocument {
  async change({ changed }) {
    if (changed === 'items' || changed === 'exchangeRate') {
      const companyCurrency = frappe.AccountingSettings.currency;
      if (this.currency.length && this.currency !== companyCurrency) {
        for (let item of this.items) {
          if (item.rate && this.exchangeRate) {
            const itemRate = await this.getFrom('Item', item.item, 'rate');

            item.rate = frappe.parseNumber(itemRate) / this.exchangeRate;
            if (item.quantity) {
              item.amount = item.rate * item.quantity;
            }
            item.amount = await this.formatIntoCustomerCurrency(item.amount);
            item.rate = await this.formatIntoCustomerCurrency(item.rate);
          }
        }
        this.netTotal = await this.formatIntoCustomerCurrency(this.netTotal);
        this.grandTotal = await this.formatIntoCustomerCurrency(
          this.grandTotal
        );
      }
    }

    if (changed === 'customer' || changed === 'supplier') {
      this.currency = await this.getFrom('Party', this[changed], 'currency');
      this.exchangeRate = await this.getExchangeRate();
    }
  }

  async formatIntoCustomerCurrency(value) {
    const companyCurrency = frappe.AccountingSettings.currency;
    if (this.currency && this.currency.length && this.currency !== companyCurrency) {
      const { numberFormat, symbol } = await this.getCustomerCurrencyInfo();
      return frappe.format(value, {
        fieldtype: 'Currency',
        currencyInfo: { numberFormat, symbol }
      });
    } else {
      return frappe.format(value, 'Currency');
    }
  }

  isForeignTransaction() {
    return this.currency
      ? this.currency !== frappe.AccountingSettings.currency
        ? 1
        : 0
      : 0;
  }

  async getCustomerCurrencyInfo() {
    if (this.numberFormat || this.symbol) {
      return { numberFormat: this.numberFormat, symbol: this.symbol };
    }
    const { numberFormat, symbol } = await frappe.getDoc(
      'Currency',
      this.currency
    );
    this.numberFormat = numberFormat;
    this.symbol = symbol;

    return { numberFormat, symbol };
  }

  async getExchangeRate() {
    const companyCurrency = frappe.AccountingSettings.currency;
    return this.currency === companyCurrency ? 1.0 : undefined;
  }

  async getBaseNetTotal() {
    if (this.isForeignTransaction()) {
      return frappe.format(
        this.getSum('items', 'amount') * (this.exchangeRate || 0),
        'Currency'
      );
    } else {
      return await this.formatIntoCustomerCurrency(
        this.getSum('items', 'amount')
      );
    }
  }

  async getRowTax(row) {
    if (row.tax) {
      let tax = await this.getTax(row.tax);
      let taxAmount = [];
      for (let d of tax.details || []) {
        const amt = (frappe.parseNumber(row.amount) * d.rate) / 100;
        taxAmount.push({
          account: d.account,
          rate: d.rate,
          amount: await this.formatIntoCustomerCurrency(amt)
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
              taxDetail.amount =
                frappe.parseNumber(taxDetail.amount) +
                frappe.parseNumber(rowTaxDetail.amount);
              taxDetail.amount = await this.formatIntoCustomerCurrency(
                taxDetail.amount
              );
              found = true;
            }
          }

          // add new row
          if (!found) {
            this.taxes.push({
              account: rowTaxDetail.account,
              rate: rowTaxDetail.rate,
              amount: rowTaxDetail.amount
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
    let grandTotal = frappe.parseNumber(this.netTotal);
    if (this.taxes) {
      for (let row of this.taxes) {
        grandTotal += frappe.parseNumber(row.amount);
      }
    }
    grandTotal = Math.floor(grandTotal * 100) / 100;

    return await this.formatIntoCustomerCurrency(grandTotal);
  }

  async getBaseGrandTotal() {
    await this.makeTaxSummary();
    let baseGrandTotal = frappe.parseNumber(this.baseNetTotal);
    if (this.taxes) {
      for (let row of this.taxes) {
        baseGrandTotal += frappe.parseNumber(row.amount) * this.exchangeRate;
      }
    }
    baseGrandTotal = Math.floor(baseGrandTotal * 100) / 100;

    return frappe.format(baseGrandTotal, 'Currency');
  }
};
