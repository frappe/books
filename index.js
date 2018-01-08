require('./scss/main.scss');
window.$ = require('jquery');

const common = require('frappe-core/frappe/common');
const Database = require('frappe-core/frappe/backends/rest_client').Database

window.frappe = require('frappe-core');
const listview = require('frappe-core/frappe/view/list.js');

async function start() {
	frappe.init();
	common.init_libs(frappe);

	frappe.db = await new Database({
		server: 'localhost:8000',
		fetch: window.fetch.bind()
	});

	const todo = require('frappe-core/frappe/models/doctype/todo/todo.js');
	frappe.init_controller('todo', todo);

	frappe.init_view({container: $('.container')});
}

start().then(() => {
	let todo_list = new listview.ListView({
		doctype: 'ToDo',
		parent: frappe.main
	});
	todo_list.render();
})

