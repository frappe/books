require('./scss/main.scss');

const client = require('frappe-core/frappe/client');

const ListView = require('frappe-core/frappe/client/view/list').ListView;
const Page = require('frappe-core/frappe/client/view/page').Page;
const Form = require('frappe-core/frappe/client/view/form').Form;

window.app = {
	setup_form() {
		this.edit_page = new Page('Edit To Do');
		this.edit_page.form = new Form({
			doctype: 'ToDo',
			parent: this.edit_page.body
		});
		this.edit_page.form.make();
	},
	setup_list() {
		this.todo_list = new Page('ToDo List');
		this.todo_list.list = new ListView({
			doctype: 'ToDo',
			parent: this.todo_list.body
		});
	}
};

// start server
client.start({
	server: 'localhost:8000',
	container: document.querySelector('.container'),
}).then(() => {
	const todo = require('frappe-core/frappe/models/doctype/todo/todo.js');
	frappe.init_controller('todo', todo);

	app.home = frappe.ui.add('a', '', frappe.ui.add('p', null, frappe.sidebar));
	app.home.textContent = 'Home';
	app.home.href = '#';

	app.make_new = frappe.ui.add('a', '', frappe.ui.add('p', null, frappe.sidebar));
	app.make_new.textContent = 'New ToDo';
	app.make_new.href = '#new/todo';

	// make pages
	app.setup_list();
	app.setup_form();

	// to do list
	frappe.router.add('default', () => {
		app.todo_list.show();
		app.todo_list.list.run();
	});

	// setup todo form
	frappe.router.add('edit/todo/:name', async (params) => {
		app.doc = await frappe.get_doc('ToDo', params.name);
		app.edit_page.show();
		app.edit_page.form.use(app.doc);
	});

	// setup todo new
	frappe.router.add('new/todo', async (params) => {
		app.doc = await frappe.get_doc({doctype: 'ToDo'});
		app.doc.set_name();
		app.edit_page.show();
		app.edit_page.form.use(app.doc, true);
	});

	frappe.router.show(window.location.hash);
});