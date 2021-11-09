export default {
    "name": "Contact",
    "doctype": "DocType",
    "isSingle": 0,
    "naming": "autoincrement",
    "pageSettings": {
        "hideTitle": true
    },
    "titleField": "fullName",
    "keywordFields": [
        "fullName"
    ],
    "fields": [
        {
            "fieldname": "fullName",
            "label": "Full Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "emailAddress",
            "label": "Email Address",
            "fieldtype": "Data"
        },
        {
            "fieldname": "userId",
            "label": "User ID",
            "fieldtype": "Link",
            "target": "User",
            "hidden": 1
        },
        {
            "fieldname": "status",
            "label": "Status",
            "fieldtype": "Select",
            "options": ["Passive", "Open", "Replied"]
        },
        {
            "fieldname": "gender",
            "label": "Gender",
            "fieldtype": "Select",
            "options": ["Male", "Female", "Gender"]
        },
        {
            "fieldname": "mobileNumber",
            "label": "Mobile Number",
            "fieldtype": "Data"
        },
        {
            "fieldname": "phone",
            "label": "Phone",
            "fieldtype": "Data"
        }
    ],

    events: {
        validate: (doc) => {

        }
    },

    listSettings: {
        getFields(list) {
            return ['fullName'];
        },
        getRowHTML(list, data) {
            return `<div class="col-11">${list.getNameHTML(data)}</div>`;
        }
    },

    layout: [
        // section 1
        {
            columns: [
                { fields: [ "fullName", "emailAddress", "userId", "status" ] },
                { fields: [ "postalCode", "gender", "phone", "mobileNumber" ] }
            ]
        }
    ]
};
