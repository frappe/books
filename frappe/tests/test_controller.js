const assert = require('assert');
const frappe = require('frappe-core');

describe('Controller', () => {
	before(function() {
		frappe.init();
		frappe.db.migrate();
	});

	it('should call controller method', () => {
		let doc = frappe.get_doc({
			doctype:'ToDo',
			subject: 'test'
		});
		doc.validate();
		assert.equal(doc.status, 'Open');
	});
});