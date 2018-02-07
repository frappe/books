const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Document', () => {
    before(async function() {
        await helpers.init_sqlite();
    });

    it('should insert a doc', async () => {
        let doc1 = test_doc();
        doc1.subject = 'insert subject 1';
        doc1.description = 'insert description 1';
        await doc1.insert();

        // get it back from the db
        let doc2 = await frappe.get_doc(doc1.doctype, doc1.name);
        assert.equal(doc1.subject, doc2.subject);
        assert.equal(doc1.description, doc2.description);

        // test frappe.db.exists
        assert.ok(await frappe.db.exists(doc1.doctype, doc1.name));
        assert.equal(await frappe.db.exists(doc1.doctype, doc1.name + '---'), false);
    });

    it('should update a doc', async () => {
        let doc = test_doc();
        await doc.insert();

        assert.notEqual(await frappe.db.get_value(doc.doctype, doc.name, 'subject'), 'subject 2');

        doc.subject = 'subject 2'
        await doc.update();

        assert.equal(await frappe.db.get_value(doc.doctype, doc.name, 'subject'), 'subject 2');
    })

    it('should get a value', async () => {
        let doc = test_doc();
        assert.equal(doc.get('subject'), 'testing 1');
    });

    it('should set a value', async () => {
        let doc = test_doc();
        doc.set('subject', 'testing 1')
        assert.equal(doc.get('subject'), 'testing 1');
    });

    it('should not allow incorrect Select option', async () => {
		let doc = test_doc();
		try {
			await doc.set('status', 'Illegal');
			assert.fail();
		} catch (e) {
			assert.ok(e instanceof frappe.errors.ValueError);
		}
    });

    it('should delete a document', async () => {
        let doc = test_doc();
        await doc.insert();

        assert.equal(await frappe.db.get_value(doc.doctype, doc.name), doc.name);

        await doc.delete();

        assert.equal(await frappe.db.get_value(doc.doctype, doc.name), null);
    });

    it('should add, fetch and delete documents with children', async() => {
        await frappe.new_doc({doctype: 'Role', name: 'Test Role'}).insert();
        await frappe.new_doc({doctype: 'Role', name: 'Test Role 1'}).insert();

        let user = frappe.new_doc({
            doctype: 'User',
            name: 'test_user',
            full_name: 'Test User',
            roles: [
                {
                    role: 'Test Role'
                }
            ]
        });
        await user.insert();

        assert.equal(user.roles.length, 1);
        assert.equal(user.roles[0].role, 'Test Role');
        assert.equal(user.roles[0].parent, user.name);
        assert.equal(user.roles[0].parenttype, user.doctype);
        assert.equal(user.roles[0].parentfield, 'roles');

        // add another role
        user.roles.push({role: 'Test Role 1'});

        await user.update();

        assert.equal(user.roles.length, 2);
        assert.equal(user.roles[1].role, 'Test Role 1');
        assert.equal(user.roles[1].parent, user.name);
        assert.equal(user.roles[1].parenttype, user.doctype);
        assert.equal(user.roles[1].parentfield, 'roles');

        // remove the first row
        user.roles = user.roles.filter((d, i) => i === 1);

        await user.update();

        user = await frappe.get_doc('User', user.name);

        assert.equal(user.roles.length, 1);
        assert.equal(user.roles[0].role, 'Test Role 1');
        assert.equal(user.roles[0].idx, 0);
        assert.equal(user.roles[0].parent, user.name);
        assert.equal(user.roles[0].parenttype, user.doctype);
        assert.equal(user.roles[0].parentfield, 'roles');
    });

});

function test_doc() {
    return frappe.new_doc({
        doctype: 'ToDo',
        status: 'Open',
        subject: 'testing 1',
        description: 'test description 1'
    });
}