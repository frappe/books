const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const frappe = require('frappe-core');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// setup frappe REST routes
frappe.init();
frappe.db.migrate();
frappe.db.write();

frappe.rest.setup(app);

app.listen(8000);

