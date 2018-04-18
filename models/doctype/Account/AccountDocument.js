const frappe = require('frappejs');
const BaseDocument = require('frappejs/model/document');

module.exports = class Account extends BaseDocument {
    async validate() {
        if (!this.accountType) {
            if (this.parentAccount) {
                this.accountType = await frappe.db.getValue('Account', this.parentAccount, 'accountType');
            } else {
                this.accountType = 'Asset';
            }
        }
    }
}