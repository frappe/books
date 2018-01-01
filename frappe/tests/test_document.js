const assert = require('assert');
const frappe = require('frappe-core');

describe('Document', () => {
	before(function() {
		frappe.init();
		frappe.db.migrate();
	});

	it('should insert a doc', () => {
		let doc1 = test_doc();
		doc1.subject = 'insert subject 1';
		doc1.description = 'insert description 1';
		doc1.insert();

		// get it back from the db
		let doc2 = frappe.get_doc(doc1.doctype, doc1.name);
		assert.equal(doc1.subject, doc2.subject);
		assert.equal(doc1.description, doc2.description);
	});

	it('should update a doc', () => {
		let doc = test_doc().insert();

		assert.notEqual(frappe.db.get_value(doc.doctype, doc.name, 'subject'), 'subject 2');

		doc.subject = 'subject 2'
		doc.update();

		assert.equal(frappe.db.get_value(doc.doctype, doc.name, 'subject'), 'subject 2');
	})

	it('should get a value', () => {
		assert.equal(test_doc().get('subject'), 'testing 1');
	});

	it('should set a value', () => {
		let doc = test_doc();
		doc.set('subject', 'testing 1')
		assert.equal(doc.get('subject'), 'testing 1');
	});

	it('should not allow incorrect Select option', () => {
		let doc = test_doc();
		assert.throws(
			() => {
				doc.set('status', 'Illegal');
			},
			frappe.ValueError
		);
	});

});

const test_doc = () => {
	return frappe.get_doc({
		doctype: 'ToDo',
		status: 'Open',
		subject: 'testing 1',
		description: 'test description 1'
	});
}