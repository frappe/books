const frappe = require('frappejs');
const Bill = require('./BillDocument');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class BillServer extends Bill {
    getPosting() {
        let entries = new LedgerPosting({reference: this, party: this.supplier});
        entries.credit(this.account, this.grandTotal);

        for (let item of this.items) {
            entries.debit(item.account, item.amount);
        }

        if (this.taxes) {
            for (let tax of this.taxes) {
                entries.debit(tax.account, tax.amount);
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
