const assert = require('assert');
const frappe = require('frappe-core');
const helpers = require('./helpers');

describe('Document', () => {
	before(async function() {
		await helpers.init_sqlite();
	});

	it('should insert a doc', async () => {
		let doc1 = await test_doc();
		doc1.subject = 'insert subject 1';
		doc1.description = 'insert description 1';
		await doc1.insert();

		// get it back from the db
		let doc2 = await frappe.get_doc(doc1.doctype, doc1.name);
		assert.equal(doc1.subject, doc2.subject);
		assert.equal(doc1.description, doc2.description);
	});

	it('should update a doc', async () => {
		let doc = await test_doc();
		await doc.insert();

		assert.notEqual(await frappe.db.get_value(doc.doctype, doc.name, 'subject'), 'subject 2');

		doc.subject = 'subject 2'
		await doc.update();

		assert.equal(await frappe.db.get_value(doc.doctype, doc.name, 'subject'), 'subject 2');
	})

	it('should get a value', async () => {
		let doc = await test_doc();
		assert.equal(doc.get('subject'), 'testing 1');
	});

	it('should set a value', async () => {
		let doc = await test_doc();
		doc.set('subject', 'testing 1')
		assert.equal(doc.get('subject'), 'testing 1');
	});

	it('should not allow incorrect Select option', async () => {
		let doc = await test_doc();
		assert.throws(
			() => {
				doc.set('status', 'Illegal');
			},
			frappe.ValueError
		);
	});

	it('should delete a document', async () => {
		let doc = await test_doc();
		await doc.insert();

		assert.equal(await frappe.db.get_value(doc.doctype, doc.name), doc.name);

		await doc.delete();

		assert.equal(await frappe.db.get_value(doc.doctype, doc.name), null);
	});

});

async function test_doc() {
	return await frappe.get_doc({
		doctype: 'ToDo',
		status: 'Open',
		subject: 'testing 1',
		description: 'test description 1'
	});
}