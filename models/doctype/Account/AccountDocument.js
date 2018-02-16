const frappe = require('frappejs');
const BaseDocument = require('frappejs/model/document');

module.exports = class Account extends BaseDocument {
    async validate() {
        if (!this.account_type) {
            if (this.parent_account) {
                this.account_type = await frappe.db.getValue('Account', this.parent_account, 'account_type');
            } else {
                this.account_type = 'Asset';
            }
        }
    }
}