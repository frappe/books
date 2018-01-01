const assert = require('assert');
const frappe = require('frappe-core');

describe('Controller', () => {
	before(function() {
		frappe.init();
		frappe.db.create_table('ToDo');
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