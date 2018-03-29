module.exports = {
    "name": "Account",
    "doctype": "DocType",
    "documentClass": require("./AccountDocument.js"),
    "isSingle": 0,
    "keywordFields": [
        "name",
        "account_type"
    ],
    "fields": [
        {
            "fieldname": "name",
            "label": "Account Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "parent_account",
            "label": "Parent Account",
            "fieldtype": "Link",
            "target": "Account",
            getFilters: (query, control) => {
                return {
                    keywords: ["like", query],
                    name: ["!=", control.doc.name]
                }
            }
        },
        {
            "fieldname": "account_type",
            "label": "Account Type",
            "fieldtype": "Select",
            "options": [
                "Asset",
                "Liability",
                "Equity",
                "Income",
                "Expense"
            ]
        }
    ],

    events: {
        validate: (doc) => {

        }
    },

    listSettings: {
        getFields(list)  {
            return ['name', 'account_type'];
        },
        getRowHTML(list, data) {
            return `<div class="col-11">${list.getNameHTML(data)} (${data.account_type})</div>`;
        }
    }
}