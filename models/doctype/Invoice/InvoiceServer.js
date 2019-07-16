const Invoice = require('./InvoiceDocument');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class InvoiceServer extends Invoice {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.customer });
    await entries.debit(this.account, this.grandTotal);

    for (let item of this.items) {
      await entries.credit(item.account, item.amount);
    }

    if (this.taxes) {
      for (let tax of this.taxes) {
        await entries.credit(tax.account, tax.amount);
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
      'Invoice',
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
