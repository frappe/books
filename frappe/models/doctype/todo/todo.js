const frappe = require('frappe-core');

class todo_meta extends frappe.meta.Meta {
	async get_list(start, limit=20) {
		return await frappe.db.get_all({
			doctype: 'ToDo',
			fields: ['name', 'subject', 'status', 'description'],
			start: start,
			limit: limit
		});
	}

	get_row_html(data) {
		return `<a href="/view/todo/${data.name}">${data.subject}</a>`;
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
