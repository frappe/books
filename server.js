const server = require('frappe-core/frappe/server');
const frappe = require('frappe-core');
const express = require('express');

server.start({
	backend: 'sqllite',
	connection_params: {db_path: 'test.db'}
}).then(() => {
	frappe.app.use(express.static('./'));
});