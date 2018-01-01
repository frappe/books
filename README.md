# Frappe Core

Core libs for Frappe Framework JS

## Examples

### Declaring Models

Models are declared by adding a `.json` model file in the `models/doctype` folder of the module/app.

	{
		"autoname": "hash",
		"name": "ToDo",
		"doctype": "DocType",
		"issingle": 0,
		"fields": [
			{
				"fieldname": "subject",
				"label": "Subject",
				"fieldtype": "Data",
				"reqd": 1
			},
			{
				"fieldname": "description",
				"label": "Description",
				"fieldtype": "Text"
			},
			{
				"fieldname": "status",
				"label": "Status",
				"fieldtype": "Select",
				"options": [
					"Open",
					"Closed"
				],
				"default": "Open",
				"reqd": 1
			}
		]
	}

### Setup / Migrate

	const frappe = require('frappe-core');
	frappe.init();

	// sync all schema from `models` folders in all apps
	frappe.migrate();

### Managing Documents

Frappe Object-Relational-Mapper (ORM) helps you manage (create, read, update, delete) documents based on the DocTypes declared.

Documents are stored in SQLite using `sql.js`

#### Create

	const frappe = require('frappe-core');
	frappe.init();

	// make a new todo
	let todo = frappe.get_doc({doctype: 'ToDo', subject: 'something'});
	todo.insert();

#### Read

	const frappe = require('frappe-core');
	frappe.init();

	// get all open todos
	let todos = frappe.db.get_all('ToDo', ['name'], {status: "Open"});
	let first_todo = frappe.get_doc('ToDo', toods[0].name);


#### Update

	const frappe = require('frappe-core');
	frappe.init();

	// get all open todos
	let todos = frappe.db.get_all('ToDo', ['name'], {status: "Open"});
	let first_todo = frappe.get_doc('ToDo', toods[0].name);

	first_todo.status = 'Closed';
	first_todo.update();

### Metadata

	const frappe = require('frappe-core');
	frappe.init();

	let todo_meta = frappe.get_meta('ToDo');

	// get all fields of type "Data"
	let data_fields = todo_meta.fields.map(d => d.fieldtype=='Data' ? d : null);

### Controllers

You can write event handlers in controllers, by declaring a `.js` file in the `models/doctype/` folder along with the model file.

The name of the class must be the slugged name of the DocType

	const frappe = require('frappe-core');

	class todo extends frappe.document.Document {
		validate() {
			// set default status as "Open" if not set
			if (!this.status) {
				this.status = 'Open';
			}
		}
	}

	module.exports = { todo: todo };

### Database

You can also directly write SQL with `frappe.db.sql`

	const frappe = require('frappe-core');
	frappe.init();

	all_todos = frappe.db.sql('select name from todo');

