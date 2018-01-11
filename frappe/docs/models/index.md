# Declaring Models

Models are declared by adding a `.json` model file in the `models/doctype` folder of the module/app.

Note: A model is called `DocType` in Frappe.js

### Example

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

