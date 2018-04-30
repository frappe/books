module.exports = {
    "name": "User",
    "doctype": "DocType",
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": [
        "name",
        "fullName"
    ],
    "fields": [
        {
            "fieldname": "name",
            "label": "Email",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "password",
            "label": "Password",
            "fieldtype": "Password",
            "required": 1,
            "hidden": 1,
        },
        {
            "fieldname": "fullName",
            "label": "Full Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "roles",
            "label": "Roles",
            "fieldtype": "Table",
            "childtype": "UserRole"
        },
        {
            "fieldname": "userId",
            "label": "User ID",
            "fieldtype": "Data",
            "hidden": 1
        }
    ]
}