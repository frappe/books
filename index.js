require('./scss/main.scss');

const client = require('frappe-core/client');

// start server
client.start({
    server: 'localhost:8000',
    container: document.querySelector('.wrapper'),
}).then(() => {
    const todo = require('frappe-core/models/doctype/todo/todo.js');
    frappe.init_controller('todo', todo);

    frappe.desk.add_sidebar_item('Home', '#');
    frappe.desk.add_sidebar_item('New ToDo', '#new/todo');

    frappe.router.default = '/list/todo';

    frappe.router.show(window.location.hash);
});