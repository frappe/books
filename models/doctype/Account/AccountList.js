const BaseList = require('frappejs/client/view/list');

module.exports = class AccountList extends BaseList {
    getFields()  {
        return ['name', 'account_type'];
    }
    getRowHTML(data) {
        return `<a href="#edit/account/${data.name}">${data.name} (${data.account_type})</a>`;
    }
}
