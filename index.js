require('./scss/main.scss');

const client = require('frappejs/client');

// start server
client.start({
    server: 'localhost:8000',
    container: document.querySelector('.wrapper'),
}).then(() => {
    frappe.todo_module = require('frappejs/models/doctype/todo/todo.js');
    frappe.account_module = require('./models/doctype/account/account.js');

    frappe.init_controller('account', frappe.account_module);
    frappe.init_controller('todo', frappe.todo_module);

    frappe.desk.add_sidebar_item('ToDo', '#list/todo');
    frappe.desk.add_sidebar_item('Accounts', '#list/account');

    frappe.router.default = '#list/todo';

    frappe.router.show(window.location.hash);
});