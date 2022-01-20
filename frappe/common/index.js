const utils = require('../utils');
const format = require('../utils/format');
const errors = require('./errors');
const BaseDocument = require('frappe/model/document');
const BaseMeta = require('frappe/model/meta');

module.exports = {
  initLibs(frappe) {
    Object.assign(frappe, utils);
    Object.assign(frappe, format);
    frappe.errors = errors;
    frappe.BaseDocument = BaseDocument;
    frappe.BaseMeta = BaseMeta;
  },
};
