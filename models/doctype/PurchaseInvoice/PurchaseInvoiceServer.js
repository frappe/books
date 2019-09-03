const frappe = require('frappejs');
const PurchaseInvoice = require('./PurchaseInvoiceDocument');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class PurchaseInvoiceServer extends PurchaseInvoice {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.supplier });
    await entries.credit(this.account, this.baseGrandTotal);

    for (let item of this.items) {
      const baseItemAmount = frappe.format(
        frappe.parseNumber(item.amount) * this.exchangeRate,
        'Currency'
      );
      await entries.debit(item.account, baseItemAmount);
    }

    if (this.taxes) {
      for (let tax of this.taxes) {
        const baseTaxAmount = frappe.format(
          frappe.parseNumber(tax.amount) * this.exchangeRate,
          'Currency'
        );
        await entries.debit(tax.account, baseTaxAmount);
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

  async afterSubmit() {
    const entries = await this.getPosting();
    await entries.post();
    await frappe.db.setValue(
      'PurchaseInvoice',
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
