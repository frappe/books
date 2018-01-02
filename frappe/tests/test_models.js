const assert = require('assert');
const frappe = require('frappe-core');

describe('Models', () => {
	before(async function() {
		await frappe.init();
		await frappe.db.migrate();
	});

	it('should get todo json', () => {
		let todo = frappe.models.get('DocType', 'ToDo');
		assert.equal(todo.issingle, 0);
	});
});