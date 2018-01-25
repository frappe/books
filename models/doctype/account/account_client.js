const BaseList = require('frappejs/client/view/list');
const BaseForm = require('frappejs/client/view/form');

class AccountList extends BaseList {
    get_fields()  {
        return ['name', 'account_type'];
    }
    get_row_html(data) {
        return `<a href="#edit/account/${data.name}">${data.name} (${data.account_type})</a>`;
    }
}

class AccountForm extends BaseForm {
    make() {
        super.make();

        // override controller event
        this.controls['parent_account'].get_filters = (query) => {
            return {
                keywords: ["like", query],
                name: ["!=", this.doc.name]
            }
        }
    }
}

module.exports = {
    Form: AccountForm,
    List: AccountList
}