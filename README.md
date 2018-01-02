# Frappe Core

Core libs for Frappe Framework JS

## Declaring Models

Models are declared by adding a `.json` model file in the `models/doctype` folder of the module/app.

```json
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
```

## Setup / Migrate

```js
	const frappe = require('frappe-core');
	frappe.init();

	// sync all schema from `models` folders in all apps
	frappe.migrate();
```

## Managing Documents

Frappe Object-Relational-Mapper (ORM) helps you manage (create, read, update, delete) documents based on the DocTypes declared.

Documents are sub-classed from the `frappe.document.Document` class.

All document write methods are asynchronous and return javascript Promise objects.

### Initialize

Documents are initialized with the `frappe.get_doc` method. If `doctype` and `name` are passed as parameters, then the document is fetched from the backend. If a simple object is passed, then object properties are set in the document.

```js
	const frappe = require('frappe-core');
	await frappe.init();

	// make a new todo
	let todo = await frappe.get_doc({doctype: 'ToDo', subject: 'something'});
```

### Create

You can insert a document in the backend with the `insert` method.

```js
	const frappe = require('frappe-core');
	await frappe.init();

	// make a new todo
	let todo = await frappe.get_doc({doctype: 'ToDo', subject: 'something'});
	await todo.insert();
```

### Read

You can read a document from the backend with the `frappe.get_doc` method

```js
	const frappe = require('frappe-core');
	await frappe.init();

	// get all open todos
	let todos = await frappe.db.get_all('ToDo', ['name'], {status: "Open"});
	let first_todo = await frappe.get_doc('ToDo', toods[0].name);
```

### Update

The `update` method updates a document.

```js
	const frappe = require('frappe-core');
	await frappe.init();

	// get all open todos
	let todos = await frappe.db.get_all('ToDo', ['name'], {status: "Open"});
	let first_todo = await frappe.get_doc('ToDo', toods[0].name);

	first_todo.status = 'Closed';
	await first_todo.update();
```

### Delete

The `delete` method deletes a document.

```js
	const frappe = require('frappe-core');
	await frappe.init();

	// get all open todos
	let todos = await frappe.db.get_all('ToDo', ['name'], {status: "Open"});
	let first_todo = await frappe.get_doc('ToDo', toods[0].name);

	await first_todo.delete();
```

## Metadata

Metadata are first class objects in Frappe. You can get a metadata object by `frappe.get_meta`. All objects from the `models` folders of all modules are loaded.

```js
	const frappe = require('frappe-core');
	frappe.init();

	let todo_meta = frappe.get_meta('ToDo');

	// get all fields of type "Data"
	let data_fields = todo_meta.fields.map(d => d.fieldtype=='Data' ? d : null);
```

## Controllers

You can write event handlers in controllers, by declaring a `.js` file in the `models/doctype/` folder along with the model file.

The name of the class must be the slugged name of the DocType

To add a standard handler, you must bind all handlers in `setup` method.

```js
	const frappe = require('frappe-core');

	class todo extends frappe.document.Document {
		setup() {
			this.add_handler('validate');
		}

		validate() {
			// set default status as "Open" if not set
			if (!this.status) {
				this.status = 'Open';
			}
		}
	}

	module.exports = { todo: todo };
```

### Controller Events

Standard events on which you can bind handlers are

- `before_insert`
- `before_update`
- `validate` (called before any write)
- `after_insert`,
- `after_update` (called after any write)
- `before_submit`
- `after_submit`
- `before_cancel`
- `after_cancel`
- `before_delete`
- `after_delete`

## Database

You can also directly write SQL with `frappe.db.sql`

```js
	const frappe = require('frappe-core');
	frappe.init();

	all_todos = frappe.db.sql('select name from todo');
```

## REST API

You can directly access documents at `/api/resource/:doctype`

### Create

- URL: `/api/resource/:doctype`
- Method: `POST`
- Data: document properties

**Example:**

- URL: `/api/resource/todo`
- Method: `POST`

Data:

```json
	{
		"subject": "test",
		"description": "test description"
	}
```

### Read

- URL: `/api/resource/:doctype/:name`
- Method: `GET`

**Example:**

- URL: `/api/resource/todo/uig7d1v12`

Reponse:

```json
	{
		"name": "uig7d1v12",
		"owner": "guest",
		"modified_by": "guest",
		"creation": "2018-01-01T12:08:19.482Z",
		"modified": "2018-01-01T12:08:19.482Z",
		"docstatus": 0,
		"subject": "test 1",
		"description": "description 1",
		"status": "Open"
	}
```

### List

- URL: `/api/resource/:doctype/`
- Method: `GET`
- Params (optional)
	- `start`: Page start
	- `limit`: Page limit

**Example:**

- URL: `/api/resource/todo`

Response:

```json
	[
		{
			"name": "r4qxyki0i6",
			"subject": "test 1"
		},
		{
			"name": "efywwvtwcp",
			"subject": "test 1"
		},
		{
			"name": "9ioz05urgp",
			"subject": "test 1"
		}
	]
```
## Tests

All tests are in the `tests` folder and are run using `mocha`. To run tests

```sh
	npm run test
```

