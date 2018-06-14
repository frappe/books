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
    //"isSubmittable": 0,
    "keywordFields": ["name", "from_emailAddress"],
    "fields": [{
            "fieldname": "name",
            "label": "name",
            "fieldtype": "Data",
            "required": 0,
            "hidden": 1,
        },
        {
            // TODO : set this to default Outgoing
            "fieldname": "from_emailAddress",
            "label": "From",
            "fieldtype": "Data",
            //"options":['None'],
            "default": "None",
            "required": 1,
        },
        {
            "fieldname": "to_emailAddress",
            "label": "To",
            "fieldtype": "Data",
            "required": 1
        },
        {

            "fieldname": "cc_emailAddress",
            "label": "cc",
            "fieldtype": "Data",
            "required": 0
        },
        {
            "fieldname": "bcc_emailAddress",
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
            "fieldname": "sentReceive",
            "label": "sentReceive",
            "fieldtype": "Check",
            "required": 0,
            "hidden": 1
        },
        // haven't captured attachments ?
    ]
}
