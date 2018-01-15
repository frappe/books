const assert = require('assert');
const frappe = require('frappe-core');
const fetch = require('node-fetch');
const helpers = require('./helpers');
const { spawn } = require('child_process');
const process = require('process');
const RESTClient = require('frappe-core/backends/rest_client')

// create a copy of frappe

var test_server;

describe('REST', () => {
    before(async function() {
        test_server = spawn('node', ['tests/test_server.js'], {
            stdio: [process.stdin, process.stdout, process.stderr, 'pipe', 'pipe']
        });

        await frappe.init();
        await frappe.login();

        frappe.db = await new RESTClient({server: 'localhost:8000'});
        frappe.fetch = fetch;

        // wait for server to start
        await frappe.sleep(1);
    });

    after(() => {
        frappe.close();
        test_server.kill();
    });

    it('should create a document', async () => {
        let doc = await frappe.get_doc({doctype:'ToDo', subject:'test rest insert 1'});
        await doc.insert();

        let doc1 = await frappe.get_doc('ToDo', doc.name);

        assert.equal(doc.subject, doc1.subject);
        assert.equal(doc1.status, 'Open');
    });

    it('should update a document', async () => {
        let doc = await frappe.get_doc({doctype:'ToDo', subject:'test rest insert 1'});
        await doc.insert();

        doc.subject = 'subject changed';
        await doc.update();

        let doc1 = await frappe.get_doc('ToDo', doc.name);
        assert.equal(doc.subject, doc1.subject);
    });

    it('should get multiple documents', async () => {
        await frappe.insert({doctype:'ToDo', subject:'all test 1'});
        await frappe.insert({doctype:'ToDo', subject:'all test 2'});

        let data = await frappe.db.get_all({doctype:'ToDo'});
        let subjects = data.map(d => d.subject);
        assert.ok(subjects.includes('all test 1'));
        assert.ok(subjects.includes('all test 2'));
    });


});