const frappe = require('frappejs');
//var out = frappe.getDoc('EmailAccount').then((data) => {this.data = data});
/*
async function Hello(){
    return frappe.getDoc('EmailAccount').then((data) => {this.data = data});
};
*/

module.exports = {
    "name": "Email",
    "doctype": "DocType",
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
            // TODO : set this to default Outgoing
            "fieldname": "fromEmailAddress",
            "label": "From",
            "fieldtype": "Data",
            //"options":['None'],
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
            "fieldtype": "Text",
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
        // haven't captured attachments ?
    ]
}
