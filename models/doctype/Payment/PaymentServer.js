import frappe from 'frappe';
import BaseDocument from 'frappe/model/document';
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
    this.amount = frappe.pesa(0);
    for (let paymentReference of this.for) {
      this.amount = this.amount.add(paymentReference.amount);
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
      .reduce((a, b) => a.add(b), frappe.pesa(0));

    if (this.amount.add(this.writeoff ?? 0).lt(referenceAmountTotal)) {
      const writeoff = frappe.format(this.writeoff, 'Currency');
      const payment = frappe.format(this.amount, 'Currency');
      const refAmount = frappe.format(referenceAmountTotal, 'Currency');
      const writeoffString = this.writeoff.gt(0)
        ? `and writeoff: ${writeoff} `
        : '';

      throw new Error(
        frappe.t(
          `Amount: ${payment} ${writeoffString}is less than the total amount allocated to references: ${refAmount}.`
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
      if (this.amount.lte(0) || this.amount.gt(outstandingAmount)) {
        let message = frappe.t(
          `Payment amount: ${frappe.format(
            this.amount,
            'Currency'
          )} should be less than Outstanding amount: ${frappe.format(
            outstandingAmount,
            'Currency'
          )}.`
        );

        if (this.amount.lte(0)) {
          const amt = frappe.format(this.amount, 'Currency');
          message = frappe.t(
            `Payment amount: ${amt} should be greater than 0.`
          );
        }

        throw new frappe.errors.ValidationError(message);
      } else {
        // update outstanding amounts in invoice and party
        let newOutstanding = outstandingAmount.sub(this.amount);
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
      refDoc.update({
        outstandingAmount: refDoc.outstandingAmount.add(amount),
      });
    });
  }
}
