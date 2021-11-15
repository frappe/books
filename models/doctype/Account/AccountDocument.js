import frappe from 'frappejs';
import BaseDocument from 'frappejs/model/document';

export default class Account extends BaseDocument {
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
