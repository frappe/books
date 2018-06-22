const frappe = require('frappejs');

module.exports = {
    "name": "Email",
    "doctype": "DocType",
    "pageSettings": {
        hideTitle: true
    },
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": ["name"],
    "fields": [{
            "fieldname": "name",
            "label": "name",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 1,
        },
        {
            "fieldname": "fromEmailAddress",
            "label": "From",
            "fieldtype": "Data",
            "default": "None",
            "required": 1,
        },
        {
            "fieldname": "toEmailAddress",
            "label": "To",
            "fieldtype": "Data",
            "required": 1
        },
        {

            "fieldname": "ccEmailAddress",
            "label": "cc",
            "fieldtype": "Data",
            "required": 0
        },
        {
            "fieldname": "bccEmailAddress",
            "label": "bcc",
            "fieldtype": "Data",
            "required": 0
        },
        {
            "fieldname": "date",
            "label": "Date",
            "fieldtype": "Date",
            "required": 0,
        },
        {
            "fieldname": "subject",
            "label": "Subject",
            "fieldtype": "Data",
            "required": 0
        },
        {
            "fieldname": "bodyText",
            "label": "Body",
            "fieldtype": "Text",
            "required": 0
        },
        {
            "fieldname": "bodyHtml",
            "label": "BodyHtml",
            "fieldtype": "Text",
            "required": 0,
            "hidden": 1,
        },
        {
            "fieldname": "sent",
            "label": "sentReceive",
            "fieldtype": "Check",
            "required": 0,
            "hidden": 1
        },
    ]
}
