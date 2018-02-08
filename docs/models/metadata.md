# Metadata

Metadata are first class objects in Frappe.js. You can get a metadata object by `frappe.getMeta`. All objects from the `models` folders of all modules are loaded.

### Example

```js
let todo_meta = frappe.getMeta('ToDo');

// get all fields of type "Data"
let data_fields = todo_meta.fields.map(d => d.fieldtype=='Data' ? d : null);
```