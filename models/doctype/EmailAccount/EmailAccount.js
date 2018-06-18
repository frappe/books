module.exports = {
    "name": "Email Account",
    "doctype": "DocType",
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": [
        "name",
        "email"
    ],
    "fields": [{
            "fieldname": "name",
            "label": "Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "email",
            "label": "Email",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "password",
            "label": "Password",
            "fieldtype": "Password",
            "required": 1,
        },
        {
            "fieldname": "defaultIncoming",
            "label": "Default Incoming",
            "fieldtype": "Check",
            "required": 0
        },
        {
            "fieldname": "emailSync",
            "label": "Email Sync : Option",
            "fieldtype": "Select",
            "options": [
                "ALL",
                "ANSWERED",
                "DELETED",
                "DRAFT",
                "FLAGGED",
                "NEW",
                "SEEN",
                "RECENT",
                "OLD",
                "UNANSWERED",
                "UNDELETED",
                "UNDRAFT",
                "UNFLAGGED",
                "UNSEEN"
            ],
            "default": "UNSEEN",
            "required": 1
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
