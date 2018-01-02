const assert = require('assert');
const frappe = require('frappe-core');

describe('Controller', () => {
	before(async function() {
		await frappe.init();
		await frappe.db.migrate();
	});

	it('should call controller method', async () => {
		let doc = await frappe.get_doc({
			doctype:'ToDo',
			subject: 'test'
		});
		doc.trigger('validate');
		assert.equal(doc.status, 'Open');
	});
});