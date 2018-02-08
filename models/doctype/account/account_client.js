const BaseList = require('frappejs/client/view/list');
const BaseForm = require('frappejs/client/view/form');

class AccountList extends BaseList {
    getFields()  {
        return ['name', 'account_type'];
    }
    getRowHTML(data) {
        return `<a href="#edit/account/${data.name}">${data.name} (${data.account_type})</a>`;
    }
}

class AccountForm extends BaseForm {
    make() {
        super.make();

        // override controller event
        this.controls['parent_account'].getFilters = (query) => {
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