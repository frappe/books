# Declaring Models

Models are declared by adding a `.js` model file in the `models/doctype` folder of the module/app.

Note: A model is called `DocType` in Frappe.js

### Fields

Every model must have a set of fields (these become database columns). All fields must have

- `fieldname`: Column name in database / property name
- `fieldtype`: Data type ([see details](fields.md))
- `label`: Display label
- `required`: Is mandatory
- `hidden`: Is hidden
- `disabled`: Is disabled

### Example

```js
module.exports = {
	"naming": "random",
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

