const BaseList = require('frappejs/client/view/list');
const frappe = require('frappejs');

module.exports = class CustomerList extends BaseList {
    constructor({doctype, parent, fields, page}) {
        super({doctype: 'Party', parent: parent, fields: fields, page: page});
    }
    getFilters() {
        let filters = super.getFilters();
        filters.customer = 1;
        return filters;
    }
}