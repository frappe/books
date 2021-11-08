import BaseDocument from 'frappejs/model/document';
import frappe from 'frappejs';
import LedgerPosting from '../../../accounting/ledgerPosting';

export default class PaymentServer extends BaseDocument {
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
    await entries.credit(this.account, this.amount);
    return entries;
  }

  async beforeSubmit() {
    if (!this.for || !this.for.length) {
      return;
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
        let message = frappe._(
          `Payment amount (${this.amount}) should be less than Outstanding amount (${outstandingAmount}).`
        );
        if (this.amount <= 0) {
          const amt = this.amount < 0 ? ` (${this.amount})` : '';
          message = frappe._(`Payment amount${amt} should be greater than 0.`);
        }
        throw new frappe.errors.ValidationError(message);
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
}
