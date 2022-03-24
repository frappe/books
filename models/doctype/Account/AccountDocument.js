import frappe from 'frappe';
import Document from 'frappe/model/document';

export default class Account extends Document {
  async validate() {
    if (!this.accountType && this.parentAccount) {
      const account = frappe.db.get('Account', this.parentAccount);
      this.accountType = account.accountType;
    }
  }
}
