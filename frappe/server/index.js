const backends = {};
backends.sqllite = require('frappe-core/frappe/backends/sqlite');

const express = require('express');
const app = express();
const frappe = require('frappe-core');
const rest_server = require('frappe-core/frappe/server/rest_server')
const models = require('frappe-core/frappe/server/models');
const common = require('frappe-core/frappe/common');
const bodyParser = require('body-parser');

async function init({backend, connection_params}) {
	await frappe.init();
	common.init_libs(frappe);
	await frappe.login();

	// walk and find models
	models.init();

	// database

	frappe.db = await new backends[backend].Database(connection_params);
	await frappe.db.connect();
	await frappe.db.migrate();
}

async function start({backend, connection_params}) {
	await init({backend, connection_params});

	// app
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	// routes
	rest_server.setup(app);

	// listen
	frappe.app = app;
	frappe.server = app.listen(frappe.config.port);
}

module.exports = {
	init: init,
	start: start
}