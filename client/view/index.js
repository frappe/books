const BaseList = require('frappejs/client/view/list');
const BaseForm = require('frappejs/client/view/form');
const frappe = require('frappejs');

module.exports = {
    getFormClass(doctype) {
        return (frappe.views['Form'] && frappe.views['Form'][doctype]) || BaseForm;
    },
    getListClass(doctype) {
        return (frappe.views['List'] && frappe.views['List'][doctype]) || BaseList;
    }
}