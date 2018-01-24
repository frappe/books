const frappe = require('frappejs');
const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class AccountMeta extends BaseMeta {
    setup_meta() {
        Object.assign(this, require('./account.json'));
    }
}

class Account extends BaseDocument {
    setup() {
        this.add_handler('validate');
    }
    async validate() {
        if (!this.account_type) {
            if (this.parent_account) {
                this.account_type = await frappe.db.get_value('Account', this.parent_account, 'account_type');
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
