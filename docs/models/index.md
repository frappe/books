# Declaring Models

Models are declared by adding a `.js` model file in the `models/doctype` folder of the module/app.

Note: A model is called `DocType` in Frappe.js

### Fields

Every model must have a set of fields (these become database columns). All fields may have the following properties:

- `fieldname`: Column name in database / property name.
- `fieldtype`: Data type ([see details](fields.md)).
- `label`: Display label.
- `required`: Is mandatory.
- `hidden`: Is hidden.
- `disabled`: Is disabled.

### Conditional Fields

The following fields: `hidden`, `required` can be conditional, depending on the values of other fields.
This is done by setting it's value to a function that receives an object with all the models fields and their values and returns a boolean.
See _"Posting Date"_ in the example below.

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
			"required": 1
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
			"required": 1
		},
		{
			"fieldname": "postingDate",
			"label": "Posting Date",
			"fieldtype": "Date",
			"required": (doc) => doc.status === "Closed"
		},
	]
}
```

