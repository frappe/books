module.exports = {
	"name": "User",
	"doctype": "DocType",
	"isSingle": 0,
	"isChild": 0,
	"keywordFields": [
        "name",
        "full_name"
    ],
	"fields": [
		{
			"fieldname": "name",
			"label": "Name",
			"fieldtype": "Data",
			"required": 1
        },
        {
            "fieldname": "full_name",
            "label": "Full Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "roles",
            "label": "Roles",
            "fieldtype": "Table",
            "childtype": "UserRole"
        }
	]
}