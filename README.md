# Frappe Core

Core libs for Frappe Framework JS

### Examples

	const frappe = require('frappe-core);

	# init database
	frappe.init();

	# make a new todo
	let todo = frappe.get_doc({doctype: 'ToDo', subject: 'something'})
	todo.insert()

	# get all todos
	let total_open = 0;
	for (let d of frappe.get_all('ToDo')) {
		todo = frappe.get_doc('ToDo', d.name);
		if (todo.status == 'Open') total_open += 1;
	}


