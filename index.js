require('./scss/main.scss');

const client = require('frappe-core/frappe/client');

const ListView = require('frappe-core/frappe/client/view/list').ListView;
const Page = require('frappe-core/frappe/client/view/page').Page;
const Form = require('frappe-core/frappe/client/view/form').Form;

window.todo_app = {};

// start server
client.start({
	server: 'localhost:8000',
	container: document.querySelector('.container'),
}).then(() => {
	const todo = require('frappe-core/frappe/models/doctype/todo/todo.js');
	frappe.init_controller('todo', todo);

	// make pages
	todo_app.edit_page = new Page('Edit To Do');
	todo_app.todo_list = new Page('ToDo List');

	// to do list
	frappe.router.add('default', () => {
		todo_app.todo_list.show();
		if (!todo_app.todo_list.list) {
			todo_app.todo_list.list = new ListView({
				doctype: 'ToDo',
				parent: todo_app.todo_list.body
			});
		}
		todo_app.todo_list.list.run();
	});

	// setup todo form
	frappe.router.add('todo/:name', async (params) => {
		todo_app.edit_page.show();
		if (!todo_app.edit_page.form) {
			todo_app.edit_page.form = new Form({
				doctype: 'ToDo',
				parent: todo_app.edit_page.body
			});
			todo_app.edit_page.form.make();
		}
		todo_app.doc = await frappe.get_doc('ToDo', params.name);
		todo_app.edit_page.form.use(todo_app.doc);
	});

	frappe.router.show(window.location.hash);
});