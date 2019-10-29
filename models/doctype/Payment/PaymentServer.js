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
    if (this.for.length > 0) {
      for (let row of this.for) {
        if (['SalesInvoice', 'PurchaseInvoice'].includes(row.referenceType)) {
          let { outstandingAmount, grandTotal } = await frappe.getDoc(
            row.referenceType,
            row.referenceName
          );
          if (outstandingAmount === null) {
            outstandingAmount = grandTotal;
          }
          if (this.amount <= 0 || this.amount > outstandingAmount) {
            // frappe.call({
            //   method: 'show-dialog',
            //   args: {
            //     title: 'Invalid Payment Entry',
            //     message: `Payment amount (${this.amount}) should be greater than 0 and less than Outstanding amount (${outstandingAmount})`
            //   }
            // });
            throw new Error(
              `Payment amount (${this.amount}) should be greater than 0 and less than Outstanding amount (${outstandingAmount})`
            );
          } else {
            await frappe.db.setValue(
              row.referenceType,
              row.referenceName,
              'outstandingAmount',
              outstandingAmount - this.amount
            );
          }
        }
      }
    } else {
      // frappe.call({
      //   method: 'show-dialog',
      //   args: {
      //     title: 'Invalid Payment Entry',
      //     message: `No reference for the payment.`
      //   }
      // });
      throw new Error(`No reference for the payment.`);
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
