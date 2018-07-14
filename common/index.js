const utils = require('../utils');
const numberFormat = require('../utils/numberFormat');
const format = require('../utils/format');
const errors = require('./errors');
const BaseDocument = require('frappejs/model/document');
const BaseMeta = require('frappejs/model/meta');

module.exports = {
    initLibs(frappe) {
        Object.assign(frappe, utils);
        Object.assign(frappe, numberFormat);
        Object.assign(frappe, format);
        frappe.errors = errors;
        frappe.BaseDocument = BaseDocument;
        frappe.BaseMeta = BaseMeta;
    }
}