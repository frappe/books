module.exports = {
	"name": "SystemSettings",
	"doctype": "DocType",
	"isSingle": 1,
	"isChild": 0,
	"keywordFields": [],
	"fields": [
		{
			"fieldname": "dateFormat",
			"label": "Date Format",
			"fieldtype": "Select",
			"options": [
				"dd/mm/yyyy",
				"mm/dd/yyyy",
				"dd-mm-yyyy",
				"mm-dd-yyyy"
			],
			"required": 1
		}
	]
}