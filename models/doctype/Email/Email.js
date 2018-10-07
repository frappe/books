const indicatorColor = require('frappejs/ui/constants/indicators');

module.exports = {
    "name": "Email",
    "doctype": "DocType",
    "pageSettings": {
        hideTitle: true
    },
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": ["name"],
    indicators: {
        key: 'read',
        colors: {
            Seen: indicatorColor.GREY,
            Unseen: indicatorColor.BLUE
        }
    },
    "fields": [{
            "fieldname": "name",
            "label": "name",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 1,
            "disabled": 0
        },
        {
            "fieldname": "fromEmailAddress",
            "label": "From",
            "fieldtype": "Data", //"Select"
            "options": [],
            "required": 1,
            "hidden": 0,
            "disabled": 0
        },
        {
            "fieldname": "toEmailAddress",
            "label": "To",
            "fieldtype": "Data",
            "required": 1,
            "hidden": 0,
            "disabled": 0
        },
        {

            "fieldname": "ccEmailAddress",
            "label": "cc",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 0,
            "disabled": 0
        },
        {
            "fieldname": "bccEmailAddress",
            "label": "bcc",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 0,
            "disabled": 0
        },
        {
            "fieldname": "date",
            "label": "Date",
            "fieldtype": "Datetime",
            "required": 0,
            "hidden": 0,
            "disabled": 1
        },
        {
            "fieldname": "subject",
            "label": "Subject",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 0,
            "disabled": 0
        },
        {
            "fieldname": "bodyText",
            "label": "Body",
            "fieldtype": "Text",
            "required": 0,
            "hidden": 0,
            "disabled": 0
        },
        {
            "fieldname": "bodyHtml",
            "label": "BodyHtml",
            "fieldtype": "Text",
            "required": 0,
            "hidden": 1,
            "disabled": 0
        },
        {
            "fieldname": "sent",
            "label": "sentReceive",
            "fieldtype": "Data",
            "hidden": 1,
            "required": 0,
        },
        {
            "fieldname": "read",
            "label": "Read",
            "fieldtype": "Select",
            "options": [
                "Seen",
                "Unseen"
            ],
            "default": "Unseen",
            "required": 1,
            "hidden": 1,
        },
        {
            "fieldname": "replyId",
            "label": "ReplyID",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 1,
            "disabled": 0
        },
        {
            "fieldname": "syncOption",
            "label": "Sync Option",
            "fieldtype": "Data", 
            "required": 0,
            "hidden": 1,
        }
    ]
}