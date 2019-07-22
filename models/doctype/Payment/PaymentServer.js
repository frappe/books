const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class PaymentServer extends BaseDocument {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.party });
    await entries.debit(this.paymentAccount, this.amount);
    for (let row of this.for) {
      await entries.credit(this.account, row.amount);
    }
    return entries;
  }

  async afterSubmit() {
    for (let row of this.for) {
      if (['Invoice', 'Bill'].includes(row.referenceType)) {
        let { outstandingAmount, grandTotal } = await frappe.getDoc(
          row.referenceType,
          row.referenceName
        );
        if (outstandingAmount === null) {
          outstandingAmount = grandTotal;
          console.log('Outstanding null');
        }
        if (this.amount > outstandingAmount) {
          console.log('Over Payment');
        } else {
          console.log('Payment Done');
          await frappe.db.setValue(
            row.referenceType,
            row.referenceName,
            'outstandingAmount',
            outstandingAmount - this.amount
          );
          const entries = await this.getPosting();
          await entries.post();
        }
      }
    }
  }

  async afterRevert() {
    const entries = await this.getPosting();
    await entries.postReverse();

    // Maybe revert outstanding amount of invoice too?
  }
};
