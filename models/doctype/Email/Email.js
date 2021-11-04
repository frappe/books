import frappe from 'frappejs';

export default {
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
            "disabled": 0
        },
        {
            "fieldname": "fromEmailAddress",
            "label": "From",
            "fieldtype": "Data",
            "required": 1,
            "hidden": 0,
            formula: async () => {
                const accountingSettings = await frappe.getDoc('AccountingSettings');
                return accountingSettings.email;
            },
            "disabled": 1
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
            "fieldname": "filePath",
            "label": "File Path",
            "fieldtype": "Text",
            "required": 0,
            "hidden": 1,
        }
    ]
};