module.exports = {
    "name": "Party",
    "doctype": "DocType",
    "isSingle": 0,
    "istable": 0,
    "keywordFields": [
        "name"
    ],
    "fields": [
        {
            "fieldname": "name",
            "label": "Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "customer",
            "label": "Customer",
            "fieldtype": "Check"
        },
        {
            "fieldname": "supplier",
            "label": "Supplier",
            "fieldtype": "Check"
        }
    ]
}