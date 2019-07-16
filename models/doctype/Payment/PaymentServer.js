const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');
const LedgerPosting = require('../../../accounting/ledgerPosting');

module.exports = class PaymentServer extends BaseDocument {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.party });
    await entries.debit(this.paymentAccount, this.amount);

    for (let row of this.for) {
      await entries.credit(
        this.account,
        row.amount,
        row.referenceType,
        row.referenceName
      );
    }
    return entries;
  }

  async afterSubmit() {
    for (let row of this.for) {
      if (row.referenceType === 'Invoice') {
        const { outstandingAmount } = await frappe.getDoc(
          'Invoice',
          row.referenceName
        );
        if (this.amount > outstandingAmount) {
          console.log('Over Payment');
        } else {
          await frappe.db.setValue(
            'Invoice',
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
