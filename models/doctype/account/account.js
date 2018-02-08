const frappe = require('frappejs');
const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class AccountMeta extends BaseMeta {
    setupMeta() {
        Object.assign(this, require('./account.json'));
    }
}

class Account extends BaseDocument {
    setup() {
        this.addHandler('validate');
    }
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

module.exports = {
    Document: Account,
    Meta: AccountMeta
};
