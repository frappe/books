const BaseList = require('frappejs/client/view/list');
const BaseForm = require('frappejs/client/view/form');

module.exports = {
    get_form_class(doctype) {
        return this.get_view_class(doctype, 'Form', BaseForm);
    },
    getList_class(doctype) {
        return this.get_view_class(doctype, 'List', BaseList);
    },
    get_view_class(doctype, class_name, default_class) {
        let client_module = this.get_client_module(doctype);
        if (client_module && client_module[class_name]) {
            return client_module[class_name];
        } else {
            return default_class;
        }
    },

    get_client_module(doctype) {
        return frappe.modules[`${doctype}_client`];
    }
}