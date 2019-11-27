const SalesInvoice = require('./SalesInvoiceDocument');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class SalesInvoiceServer extends SalesInvoice {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.customer });
    await entries.debit(this.account, this.baseGrandTotal);

    for (let item of this.items) {
      await entries.credit(item.account, item.baseAmount);
    }

    if (this.taxes) {
      for (let tax of this.taxes) {
        await entries.credit(tax.account, tax.baseAmount);
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

  async beforeInsert() {
    const entries = await this.getPosting();
    await entries.validateEntries();
  }

  async beforeSubmit() {
    const entries = await this.getPosting();
    await entries.post();
    await frappe.db.setValue(
      'SalesInvoice',
      this.name,
      'outstandingAmount',
      this.baseGrandTotal
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
