const BaseList = require('frappejs/client/view/list');
const BaseTree = require('frappejs/client/view/tree');
const BaseForm = require('frappejs/client/view/form');
const frappe = require('frappejs');

module.exports = {
    getFormClass(doctype) {
        return (frappe.views['Form'] && frappe.views['Form'][doctype]) || BaseForm;
    },
    getListClass(doctype) {
        return (frappe.views['List'] && frappe.views['List'][doctype]) || BaseList;
    },
    getTreeClass(doctype) {
        return (frappe.views['Tree'] && frappe.views['Tree'][doctype] || BaseTree);
    }
}