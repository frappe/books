import frappe from 'frappe';
import BaseDocument from 'frappe/model/document';

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
}
