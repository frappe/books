const utils = require('../utils');
const models = require('../model/models');
const model = require('../model');
const _document = require('../model/document');
const meta = require('../model/meta');
const _session = require('../session');


module.exports = {
	init_libs(frappe) {
		Object.assign(frappe, utils);
		frappe.model = model;
		frappe.models = new models.Models();
		frappe.document = _document;
		frappe.meta = meta;
		frappe._session = _session;
	}
}