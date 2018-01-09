const frappe = require('frappe-core');

class todo_meta extends frappe.meta.Meta {
	setup_meta() {
		Object.assign(this, require('./todo.json'));
		this.name = 'ToDo';
		this.list_options.fields = ['name', 'subject', 'status', 'description'];
	}

	get_row_html(data) {
		return `<a href="#todo/${data.name}">${data.subject}</a>`;
	}

}

class todo extends frappe.document.Document {
	setup() {
		this.add_handler('validate');
	}
	validate() {
		if (!this.status) {
			this.status = 'Open';
		}
	}
}

module.exports = {
	todo: todo,
	todo_meta: todo_meta
};
