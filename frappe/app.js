const app = require('express')();
const frappe = require('frappe-core');

// setup frappe REST routes
frappe.init({app:app}).then(frappe.start());

