# Controllers

In Frappe.js you can extend the metadata class as well as the document class for a particular DocType.

You can write event handlers in controllers, by declaring a `.js` file in the `models/doctype/` folder along with the model file.

You must also mind the controller to the model file by the `documentClass` property.

## Naming

1. The name of the controller class must be the slugged name of the DocType (example `todo`)
2. The name of the `meta` class must be the name of the controller class prefixed by `meta_` (example `meta_todo`)

To add a standard handler, you must bind all handlers in `setup` method.

## Document Controller

You can bind events to the controller that will be called when an action is completed on a document or its property.

The document controller represents a single record and is subclassed from the `frappe.document.Document` class

```js
const frappe = require('frappejs');

// extend the document and add event handlers
class todo extends frappe.document.Document {
	validate() {
		if (!this.status) {
			this.status = 'Open';
		}
	}
}
```

## Metadata Controller

The `meta` class contains actions that are done on a group of objects and a document represents a single object. So properties and actions related to the group will be part of the `meta` class.

```js
// extend the meta class
class todo_meta extends frappe.meta.Meta {
	getRowHTML(data) {
		return `<a href="#edit/todo/${data.name}">${data.subject}</a>`;
	}
}
```


### Controller Events

Standard events on which you can bind handlers are

- `beforeInsert`
- `beforeUpdate`
- `validate` (called before any write)
- `afterInsert`,
- `afterUpdate` (called after any write)
- `beforeSubmit`
- `afterSubmit`
- `beforeCancel`
- `afterCancel`
- `beforeDelete`
- `afterDelete`
