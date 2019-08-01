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

  async beforeSubmit() {
    if (this.for.length > 0)
      for (let row of this.for) {
        if (['SalesInvoice', 'PurchaseInvoice'].includes(row.referenceType)) {
          let { outstandingAmount, grandTotal } = await frappe.getDoc(
            row.referenceType,
            row.referenceName
          );
          if (outstandingAmount === null) {
            outstandingAmount = grandTotal;
          }
          if (this.amount > outstandingAmount) {
            frappe.call({
              method: 'show-dialog',
              args: {
                title: 'Invalid Payment Entry',
                message: `Payment amount is greater than Outstanding amount by \
                            ${this.amount - outstandingAmount}`
              }
            });
            throw new Error();
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
    else {
      frappe.call({
        method: 'show-dialog',
        args: {
          title: 'Invalid Payment Entry',
          message: `No reference for the payment.`
        }
      });
      throw new Error();
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
