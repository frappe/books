export default {
    "name": "CompanySettings",
    "label": "Company Settings",
    "naming": "autoincrement",
    "isSingle": true,
    "isChild": false,
    "keywordFields": [
        "companyName"
    ],
    "fields": [
        {
            "fieldname": "companyName",
            "label": "Company Name",
            "fieldtype": "Data",
            "disabled": false,
            "required": true
        },
        {
            "fieldname": "companyAddress",
            "label": "Company Address",
            "fieldtype": "Link",
            "disabled": false,
            "required": true,
            "target": "Address"
        }
    ]
};