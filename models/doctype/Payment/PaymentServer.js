const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class PaymentServer extends BaseDocument {
  async change({ changed }) {
    if (changed === 'for') {
      this.amount = 0;
      for (let paymentReference of this.for) {
        this.amount += paymentReference.amount;
      }
    }
  }

  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.party });
    await entries.debit(this.paymentAccount, this.amount);
    for (let row of this.for) {
      await entries.credit(this.account, row.amount);
    }
    return entries;
  }

  async beforeSubmit() {
    if (!this.for.length) {
      throw new Error(`No reference for the payment.`);
    }
    for (let row of this.for) {
      if (!['SalesInvoice', 'PurchaseInvoice'].includes(row.referenceType)) {
        continue;
      }
      let referenceDoc = await frappe.getDoc(
        row.referenceType,
        row.referenceName
      );
      let { outstandingAmount, baseGrandTotal } = referenceDoc;
      if (outstandingAmount == null) {
        outstandingAmount = baseGrandTotal;
      }
      if (this.amount <= 0 || this.amount > outstandingAmount) {
        throw new Error(
          `Payment amount (${this.amount}) should be greater than 0 and less than Outstanding amount (${outstandingAmount})`
        );
      } else {
        // update outstanding amounts in invoice and party
        let newOutstanding = outstandingAmount - this.amount;
        await referenceDoc.set('outstandingAmount', newOutstanding);
        await referenceDoc.update();
        let party = await frappe.getDoc('Party', this.party);
        await party.updateOutstandingAmount();
      }
    }
  }

  async afterSubmit() {
    const entries = await this.getPosting();
    await entries.post();
  }

  async afterRevert() {
    const entries = await this.getPosting();
    await entries.postReverse();

    // Maybe revert outstanding amount of invoice too?
  }
};
