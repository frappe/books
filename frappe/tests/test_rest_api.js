const assert = require('assert');
const frappe = require('frappe-core');
const fetch = require('node-fetch');

describe('Models', () => {
	before(async function() {
		var app = require('express')();
		await frappe.init();
		frappe.init_app(app);
		await frappe.start();
	});

	after(() => {
		frappe.close();
	});

	it('should create a document', async () => {
		let res = await fetch('http://localhost:8000/api/resource/todo', {
			method: 'post',
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
	// 	frappe.set_backend('rest', {
	// 		server: 'http://localhost:8000'
	// 	});

	// 	let doc = await frappe.get_doc({doctype: 'ToDo', subject: 'test rest backend 1'});
	// 	await doc.insert();

	// 	let doc_reloaded = await frappe.get_doc('ToDo', doc.name);

	// })

});