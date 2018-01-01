const assert = require('assert');
const frappe = require('frappe-core');

describe('Document', () => {
	before(function() {
		frappe.init();
		frappe.db.migrate();
	});

	it('should insert and get values', () => {
		frappe.db.sql('delete from todo');
		frappe.get_doc({doctype:'ToDo', subject: 'testing 1'}).insert();
		frappe.get_doc({doctype:'ToDo', subject: 'testing 3'}).insert();
		frappe.get_doc({doctype:'ToDo', subject: 'testing 2'}).insert();

		let subjects = frappe.db.get_all('ToDo', ['name', 'subject']).map(d => d.subject);

		assert.ok(subjects.includes('testing 1'));
		assert.ok(subjects.includes('testing 2'));
		assert.ok(subjects.includes('testing 3'));
	});

	it('should filter correct values', () => {
		let subjects = null;

		frappe.db.sql('delete from todo');
		frappe.get_doc({doctype:'ToDo', subject: 'testing 1', status: 'Open'}).insert();
		frappe.get_doc({doctype:'ToDo', subject: 'testing 3', status: 'Open'}).insert();
		frappe.get_doc({doctype:'ToDo', subject: 'testing 2', status: 'Closed'}).insert();

		subjects = frappe.db.get_all('ToDo', ['name', 'subject'],
			{status: 'Open'}).map(d => d.subject);

		assert.ok(subjects.includes('testing 1'));
		assert.ok(subjects.includes('testing 3'));
		assert.equal(subjects.includes('testing 2'), false);

		subjects = frappe.db.get_all('ToDo', ['name', 'subject'],
			{status: 'Closed'}).map(d => d.subject);

		assert.equal(subjects.includes('testing 1'), false);
		assert.equal(subjects.includes('testing 3'), false);
		assert.ok(subjects.includes('testing 2'));

	});
});