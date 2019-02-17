module.exports = {
    "name": "Tax",
    "doctype": "DocType",
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": ["name"],
    "fields": [
        {
            "fieldname": "name",
            "label": "Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "details",
            "label": "Details",
            "fieldtype": "Table",
            "childtype": "TaxDetail",
            "required": 1
        }
    ]
}