module.exports = {
    "name": "Email Account",
    "doctype": "DocType",
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": [
        "name",
        "from_emailAddress"
    ],
    "fields": [{
            "fieldname": "name",
            "label": "Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "from_emailAddress",
            "label": "Email",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "defaultIncoming",
            "label": "Default Incoming",
            "fieldtype": "Check",
            "required": 0
        },
        {
            "fieldname": "password",
            "label": "Password",
            "fieldtype": "Password",
            "required": 1,
            // "hidden": 1, uncomment when s: OAuth
        },
        {
            "fieldname": "host",
            "label": "Host",
            "fieldtype": "Link",
            "required": 1
        },
        {
            "fieldname": "port",
            "label": "Port",
            "fieldtype": "Int",
            "required": 1
        },
        {
            "fieldname": "defaultOutgoing",
            "label": "Default Outgoing",
            "fieldtype": "Check",
            "required": 0
        },
        {
            "fieldname": "clientId",
            "label": "Client Id",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "clientSecret",
            "label": "Client Secret",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "refreshToken",
            "label": "Refresh Token",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "initialSync",
            "label": "Initial Sync",
            "fieldtype": "Int",
            "default": "50",
            "required": 1
        }
    ]
}
