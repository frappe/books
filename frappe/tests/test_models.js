const assert = require('assert');
const frappe = require('frappe-core');
const helpers = require('./helpers');

describe('Models', () => {
	before(async function() {
		await helpers.init_sqlite();
	});

	it('should get todo json', () => {
		let todo = frappe.models.get('DocType', 'ToDo');
		assert.equal(todo.issingle, 0);
	});
});