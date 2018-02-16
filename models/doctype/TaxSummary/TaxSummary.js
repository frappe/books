module.exports = {
	"name": "TaxSummary",
	"doctype": "DocType",
	"isSingle": 0,
	"isChild": 1,
	"keywordFields": [],
	"fields": [
		{
			"fieldname": "account",
			"label": "Tax Account",
			"fieldtype": "Link",
			"target": "Account",
			"required": 1
		},
		{
			"fieldname": "rate",
			"label": "Rate",
			"fieldtype": "Float",
			"required": 1
		},
		{
			"fieldname": "amount",
			"label": "Amount",
			"fieldtype": "Currency",
			"required": 1
		}
	]
}