const BaseList = require('frappejs/client/view/list');

module.exports = class AccountList extends BaseList {
    getFields()  {
        return ['name', 'account_type'];
    }
    getRowHTML(data) {
        return `<div class="col-11">${this.getNameHTML(data)} (${data.account_type})</div>`;
    }
}
