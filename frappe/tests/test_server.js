const app = require('express')();
const frappe = require('frappe-core');

async function start_server() {
	console.log('Starting test server...');
	await frappe.init();
	await frappe.init_db('sqlite', {db_path: 'test.db'});
	await frappe.init_app(app);
	await frappe.start();
}

if (require.main === module) {
	start_server();
}