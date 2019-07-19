const frappe = require('frappejs');
const Bill = require('./BillDocument');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class BillServer extends Bill {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.supplier });
    await entries.credit(this.account, this.grandTotal);

    for (let item of this.items) {
      await entries.debit(item.account, item.amount);
    }

    if (this.taxes) {
      for (let tax of this.taxes) {
        await entries.debit(tax.account, tax.amount);
      }
    }
    return entries;
  }

  async getPayments() {
    let payments = await frappe.db.getAll({
      doctype: 'PaymentFor',
      fields: ['parent'],
      filters: { referenceName: this.name },
      orderBy: 'name'
    });
    if (payments.length != 0) {
      return payments;
    }
    return [];
  }

  async afterSubmit() {
    const entries = await this.getPosting();
    await entries.post();
    await frappe.db.setValue(
      'Bill',
      this.name,
      'outstandingAmount',
      this.grandTotal
    );
  }

  async afterRevert() {
    let paymentRefList = await this.getPayments();
    for (let paymentFor of paymentRefList) {
      const paymentReference = paymentFor.parent;
      const payment = await frappe.getDoc('Payment', paymentReference);
      const paymentEntries = await payment.getPosting();
      await paymentEntries.postReverse();
      // To set the payment status as unsubmitted.
      payment.revert();
    }
    const entries = await this.getPosting();
    await entries.postReverse();
  }
};
