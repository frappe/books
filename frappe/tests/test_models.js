const assert = require('assert');
const frappe = require('frappe-core');

describe('Models', () => {
	before(function() {
		frappe.init();
		frappe.db.migrate();
	});

	it('should get todo json', () => {
		let todo = frappe.models.get('DocType', 'ToDo');
		assert.equal(todo.issingle, 0);
	});
});