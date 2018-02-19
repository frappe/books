module.exports = {
	"autoname": "random",
	"name": "ToDo",
	"doctype": "DocType",
	"isSingle": 0,
	"keywordFields": [
		"subject",
		"description"
	],
	"fields": [
		{
			"fieldname": "subject",
			"label": "Subject",
			"fieldtype": "Data",
			"required": 1
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
			"fieldname": "description",
			"label": "Description",
			"fieldtype": "Text"
		}
	]
}