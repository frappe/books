const process = require('process');
const frappe = require('frappejs');

class Models {
    constructor() {
        this.data = {doctype: {}};
        this.controllers = {};
        this.meta_classes = {};
    }

    get(doctype, name) {
        return this.data[frappe.slug(doctype)][frappe.slug(name)];
    }

    get_controller(doctype) {
        return this.controllers[frappe.slug(doctype)];
    }

    get_meta_class(doctype) {
        return this.meta_classes[frappe.slug(doctype)] || frappe.meta.Meta;
    }

}

module.exports = { Models: Models }