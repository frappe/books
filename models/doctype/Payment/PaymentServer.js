import frappe from 'frappe';
import Document from 'frappe/model/document';
import LedgerPosting from '../../../accounting/ledgerPosting';

export default class PaymentServer extends Document {
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
    const doc = await frappe.doc.getDoc(doctype, referenceName);

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
    this.validateWriteOff();
  }

  validateAccounts() {
    if (this.paymentAccount !== this.account || !this.account) return;
    throw new frappe.errors.ValidationError(
      `To Account and From Account can't be the same: ${this.account}`
    );
  }

  validateReferenceAmount() {
    if (!this.for?.length) return;

    const referenceAmountTotal = this.for
      .map(({ amount }) => amount)
      .reduce((a, b) => a.add(b), frappe.pesa(0));

    if (this.amount.add(this.writeoff ?? 0).gte(referenceAmountTotal)) {
      return;
    }

    const writeoff = frappe.format(this.writeoff, 'Currency');
    const payment = frappe.format(this.amount, 'Currency');
    const refAmount = frappe.format(referenceAmountTotal, 'Currency');

    if (this.writeoff.gt(0)) {
      throw new frappe.errors.ValidationError(
        frappe.t`Amount: ${payment} and writeoff: ${writeoff} 
          is less than the total amount allocated to 
          references: ${refAmount}.`
      );
    }

    throw new frappe.errors.ValidationError(
      frappe.t`Amount: ${payment} is less than the total
        amount allocated to references: ${refAmount}.`
    );
  }

  validateWriteOff() {
    if (this.writeoff.isZero()) {
      return;
    }

    if (!frappe.AccountingSettings.writeOffAccount) {
      throw new frappe.errors.ValidationError(
        frappe.t`Write Off Account not set.
          Please set Write Off Account in General Settings`
      );
    }
  }

  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.party });

    await entries.debit(this.paymentAccount, this.amount.sub(this.writeoff));
    await entries.credit(this.account, this.amount.sub(this.writeoff));

    if (this.writeoff.isZero()) {
      return [entries];
    }

    const writeoffEntry = new LedgerPosting({
      reference: this,
      party: this.party,
    });
    const { writeOffAccount } = frappe.AccountingSettings;

    if (this.paymentType === 'Pay') {
      await writeoffEntry.debit(this.account, this.writeoff);
      await writeoffEntry.credit(writeOffAccount, this.writeoff);
    } else {
      await writeoffEntry.debit(writeOffAccount, this.writeoff);
      await writeoffEntry.credit(this.account, this.writeoff);
    }

    return [entries, writeoffEntry];
  }

  async beforeSubmit() {
    if (!this.for || !this.for.length) {
      return;
    }
    for (let row of this.for) {
      if (!['SalesInvoice', 'PurchaseInvoice'].includes(row.referenceType)) {
        continue;
      }
      let referenceDoc = await frappe.doc.getDoc(
        row.referenceType,
        row.referenceName
      );
      let { outstandingAmount, baseGrandTotal } = referenceDoc;
      if (outstandingAmount == null) {
        outstandingAmount = baseGrandTotal;
      }
      if (this.amount.lte(0) || this.amount.gt(outstandingAmount)) {
        let message = frappe.t`Payment amount: ${frappe.format(
          this.amount,
          'Currency'
        )} should be less than Outstanding amount: ${frappe.format(
          outstandingAmount,
          'Currency'
        )}.`;

        if (this.amount.lte(0)) {
          const amt = frappe.format(this.amount, 'Currency');
          message = frappe.t`Payment amount: ${amt} should be greater than 0.`;
        }

        throw new frappe.errors.ValidationError(message);
      } else {
        // update outstanding amounts in invoice and party
        let newOutstanding = outstandingAmount.sub(this.amount);
        await referenceDoc.set('outstandingAmount', newOutstanding);
        await referenceDoc.update();
        let party = await frappe.doc.getDoc('Party', this.party);
        await party.updateOutstandingAmount();
      }
    }
  }

  async afterSubmit() {
    const entryList = await this.getPosting();
    for (const entry of entryList) {
      await entry.post();
    }
  }

  async afterRevert() {
    this.updateReferenceOutstandingAmount();
    const entryList = await this.getPosting();
    for (const entry of entryList) {
      await entry.postReverse();
    }
  }

  async updateReferenceOutstandingAmount() {
    await this.for.forEach(async ({ amount, referenceType, referenceName }) => {
      const refDoc = await frappe.doc.getDoc(referenceType, referenceName);
      refDoc.setMultiple({
        outstandingAmount: refDoc.outstandingAmount.add(amount),
      });
      refDoc.update();
    });
  }
}
