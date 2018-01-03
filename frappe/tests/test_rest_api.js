const assert = require('assert');
const frappe = require('frappe-core');
const fetch = require('node-fetch');
const helpers = require('./helpers');
const { spawn } = require('child_process');
const process = require('process');

// create a copy of frappe

var test_server;

describe('REST', () => {
	before(async function() {
		await helpers.init_sqlite();
		test_server = spawn('node', ['frappe/tests/test_server.js'], {
			stdio: [0, 'pipe', 'pipe' ]
		});

		// wait for server to start
		await frappe.sleep(1);
	});

	after(() => {
		frappe.close();
		test_server.kill();
	});

	it('should create a document', async () => {
		let res = await fetch('http://localhost:8000/api/resource/todo', {
			method: 'POST',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({subject: 'test rest insert 1', description: 'test rest description 1'})
		});
		let doc = await res.json();
		assert.equal(doc.subject, 'test rest insert 1');
		assert.equal(doc.description, 'test rest description 1');
	});

	// it('should create a document with rest backend', async () => {

	// 	frappe.init_db('rest', { server: 'http://localhost:8000' });

	// 	let doc = await frappe.get_doc({doctype: 'ToDo', subject: 'test rest backend 1'});
	// 	await doc.insert();

	// 	let doc_reloaded = await frappe.get_doc('ToDo', doc.name);

	// })

});