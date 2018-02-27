const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');

module.exports = class Invoice extends BaseDocument {
    async afterSubmit() {
        // make ledger entry
    }

    async getRowTax(row) {
        if (row.tax) {
            let tax = await this.getTax(row.tax);
            let taxAmount = [];
            for (let d of (tax.details || [])) {
                taxAmount.push({account: d.account, rate: d.rate, amount: row.amount * d.rate / 100});
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

    makeTaxSummary() {
        if (!this.taxes) this.taxes = [];

        // reset tax amount
        this.taxes.map(d => { d.amount = 0; d.rate = 0; });

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
                            taxDetail.amount += rowTaxDetail.amount;
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
    getGrandTotal() {
        this.makeTaxSummary();
        let grandTotal = this.netTotal;
        if (this.taxes) {
            for (let row of this.taxes) {
                grandTotal += row.amount;
            }
        }
        return grandTotal;
    }
}