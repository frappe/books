# Managing Documents

Frappe.js Object-Relational-Mapper (ORM) helps you manage (create, read, update, delete) documents based on the DocTypes declared.

Documents are sub-classed from the `frappe.document.Document` class.

All document write methods are asynchronous and return javascript Promise objects.

### Initialize

Documents are initialized with the `frappe.getDoc` method. If `doctype` and `name` are passed as parameters, then the document is fetched from the backend. If a simple object is passed, then object properties are set in the document.

```js
// make a new todo
let todo = await frappe.getDoc({doctype: 'ToDo', subject: 'something'});
```

### Create

You can insert a document in the backend with the `insert` method.

```js
// make a new todo
let todo = await frappe.getDoc({doctype: 'ToDo', subject: 'something'});
await todo.insert();
```

### Read

You can read a document from the backend with the `frappe.getDoc` method

```js
// get all open todos
let todos = await frappe.db.getAll({doctype:'ToDo', fields:['name'], filters: {status: "Open"});
let first_todo = await frappe.getDoc('ToDo', toods[0].name);
```

### Update

The `update` method updates a document.

```js
// get all open todos
let todos = await frappe.db.getAll({doctype:'ToDo', fields:['name'], filters: {status: "Open"});
let first_todo = await frappe.getDoc('ToDo', toods[0].name);

first_todo.status = 'Closed';
await first_todo.update();
```

### Delete

The `delete` method deletes a document.

```js
// get all open todos
let todos = await frappe.db.getAll({doctype:'ToDo', fields:['name'], filters: {status: "Open"});
let first_todo = await frappe.getDoc('ToDo', toods[0].name);

await first_todo.delete();
```

### Extending Documents

Each model can be extended by adding events in the [controller](controllers.md) class.