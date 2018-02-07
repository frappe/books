const utils = require('../utils');
const number_format = require('../utils/number_format');
const model = require('../model');
const BaseDocument = require('../model/document');
const BaseMeta = require('../model/meta');
const _session = require('../session');
const errors = require('./errors');


module.exports = {
    init_libs(frappe) {
        Object.assign(frappe, utils);
        Object.assign(frappe, number_format);
        frappe.model = model;
        frappe.BaseDocument = BaseDocument;
        frappe.BaseMeta = BaseMeta;
        frappe._session = _session;
        frappe.errors = errors;
    }
}