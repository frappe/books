import frappe from 'frappejs';
import BaseDocument from 'frappejs/model/document';
import LedgerPosting from '../../../accounting/ledgerPosting';

export default class PaymentServer extends BaseDocument {
  async change({ changed }) {
    switch (changed) {
      case 'for': {
        this.updateAmountOnReferenceUpdate();
        await this.updateDetailsOnReferenceUpdate();
      }
      case 'amount': {
        this.updateReferenceOnAmountUpdate();
      }
    }
  }

  async updateDetailsOnReferenceUpdate() {
    const { referenceType, referenceName } = this.for[0];
    if (
      this.for?.length !== 1 ||
      this.party ||
      this.paymentType ||
      !referenceName ||
      !referenceType
    ) {
      return;
    }

    const doctype = referenceType;
    const doc = await frappe.getDoc(doctype, referenceName);

    let party;
    let paymentType;

    if (doctype === 'SalesInvoice') {
      party = doc.customer;
      paymentType = 'Receive';
    } else if (doctype === 'PurchaseInvoice') {
      party = doc.supplier;
      paymentType = 'Pay';
    }

    this.party = party;
    this.paymentType = paymentType;
  }

  updateAmountOnReferenceUpdate() {
    this.amount = 0;
    for (let paymentReference of this.for) {
      this.amount += paymentReference.amount;
    }
  }

  updateReferenceOnAmountUpdate() {
    if (this.for?.length !== 1) return;
    this.for[0].amount = this.amount;
  }

  async validate() {
    this.validateAccounts();
    this.validateReferenceAmount();
  }

  validateAccounts() {
    if (this.paymentAccount !== this.account || !this.account) return;
    throw new Error(
      `To Account and From Account can't be the same: ${this.account}`
    );
  }

  validateReferenceAmount() {
    if (!this.for?.length) return;
    const referenceAmountTotal = this.for
      .map(({ amount }) => amount)
      .reduce((a, b) => a + b, 0);

    if (this.amount + (this.writeoff ?? 0) < referenceAmountTotal) {
      const writeoff = frappe.format(this.writeoff, 'Currency');
      const payment = frappe.format(this.amount, 'Currency');
      const refAmount = frappe.format(referenceAmountTotal, 'Currency');
      const writeoffString =
        this.writeoff > 0 ? `and writeoff: ${writeoff} ` : '';

      throw new Error(
        frappe._(
          `Amount: ${payment} ${writeoffString}is less than the total amount allocated to references: ${refAmount}`
        )
      );
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
    this.updateReferenceOutstandingAmount();
    const entries = await this.getPosting();
    await entries.postReverse();
  }

  async updateReferenceOutstandingAmount() {
    await this.for.forEach(async ({ amount, referenceType, referenceName }) => {
      const refDoc = await frappe.getDoc(referenceType, referenceName);
      refDoc.update({ outstandingAmount: refDoc.outstandingAmount + amount });
    });
  }
}
