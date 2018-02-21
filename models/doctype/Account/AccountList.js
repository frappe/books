const BaseList = require('frappejs/client/view/list');

module.exports = class AccountList extends BaseList {
    getFields()  {
        return ['name', 'account_type'];
    }
    getRowHTML(data) {
        return `${data.name} (${data.account_type})`;
    }
}
