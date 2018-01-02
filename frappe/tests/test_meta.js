const assert = require('assert');
const frappe = require('frappe-core');

describe('Meta', () => {
	before(async function() {
		await frappe.init();
		await frappe.db.migrate();
	});

	it('should get init from json file', () => {
		let todo = frappe.get_meta('ToDo');
		assert.equal(todo.issingle, 0);
	});

	it('should get fields from meta', () => {
		let todo = frappe.get_meta('ToDo');
		let fields = todo.fields.map((df) => df.fieldname);
		assert.ok(fields.includes('subject'));
		assert.ok(fields.includes('description'));
		assert.ok(fields.includes('status'));
	});
});