const frappe = require('frappejs');
const BaseDocument = require('frappejs/model/document');

module.exports = class Account extends BaseDocument {
  async validate() {
    if (!this.accountType && this.parentAccount) {
      this.accountType = await frappe.db.getValue(
        'Account',
        this.parentAccount,
        'accountType'
      );
    }
  }
};
