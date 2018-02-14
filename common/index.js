const utils = require('../utils');
const number_format = require('../utils/number_format');
const format = require('../utils/format');
const model = require('../model');
const _session = require('../session');
const errors = require('./errors');

module.exports = {
    init_libs(frappe) {
        Object.assign(frappe, utils);
        Object.assign(frappe, number_format);
        Object.assign(frappe, format);
        frappe.model = model;
        frappe._session = _session;
        frappe.errors = errors;
    }
}