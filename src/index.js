const client = require('frappejs/client');

// start server
client.start({
    server: 'localhost:8000',
    container: document.querySelector('.wrapper'),
}).then(() => {

    // require modules
    frappe.modules.todo = require('frappejs/models/doctype/todo/todo.js');
    frappe.modules.account = require('../models/doctype/account/account.js');
    frappe.modules.item = require('../models/doctype/item/item.js');
    frappe.modules.customer = require('../models/doctype/customer/customer.js');

    frappe.modules.todo_client = require('frappejs/models/doctype/todo/todo_client.js');
    frappe.modules.account_client = require('../models/doctype/account/account_client.js');

    frappe.desk.add_sidebar_item('ToDo', '#list/todo');
    frappe.desk.add_sidebar_item('Accounts', '#list/account');
    frappe.desk.add_sidebar_item('Items', '#list/item');
    frappe.desk.add_sidebar_item('Customers', '#list/customer');

    frappe.router.default = '#list/todo';

    frappe.router.show(window.location.hash);
});

module.exports = false;