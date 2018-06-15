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
            "fieldname": "password",
            "label": "Password",
            "fieldtype": "Password",
            "required": 1,
            // "hidden": 1, uncomment when s: OAuth
        },
        {
            "fieldname": "defaultIncoming",
            "label": "Default Incoming",
            "fieldtype": "Check",
            "required": 0
        },
        {
            "fieldname": "imapHost",
            "label": "IMAP Host",
            "fieldtype": "Link",
            "required": 1
        },
        {
            "fieldname": "imapPort",
            "label": "IMAP Port",
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
            "fieldname": "smtpHost",
            "label": "SMTP Host",
            "fieldtype": "Link",
            "required": 1
        },
        {
            "fieldname": "smtpPort",
            "label": "SMTP Port",
            "fieldtype": "Int",
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
