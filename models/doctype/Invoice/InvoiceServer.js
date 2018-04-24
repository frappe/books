const Invoice = require('./InvoiceDocument');
const frappe = require('frappejs');
const LedgerPosting = rootRequire('accounting/ledgerPosting');

module.exports = class InvoiceServer extends Invoice {
    getPosting() {
        let entries = new LedgerPosting({reference: this, party: this.customer});
        entries.debit(this.account, this.grandTotal);

        for (let item of this.items) {
            entries.credit(item.account, item.amount);
        }

        if (this.taxes) {
            for (let tax of this.taxes) {
                entries.credit(tax.account, tax.amount);
            }
        }
        return entries;

    }

    async afterSubmit() {
        await this.getPosting().post();
    }

    async afterRevert() {
        await this.getPosting().postReverse();
    }
}