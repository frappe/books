module.exports = {
    "name": "Account",
    "doctype": "DocType",
    "documentClass": require("./AccountDocument.js"),
    "isSingle": 0,
    "keywordFields": [
        "name",
        "rootType",
        "accountType"
    ],
    "fields": [
        {
            "fieldname": "name",
            "label": "Account Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "parentAccount",
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
            "fieldname": "rootType",
            "label": "Root Type",
            "fieldtype": "Select",
            "options": [
                "Asset",
                "Liability",
                "Equity",
                "Income",
                "Expense"
            ]
        },
        {
            "fieldname": "accountType",
            "label": "Account Type",
            "fieldtype": "Select",
            "options": [
                "Accumulated Depreciation",
                "Bank",
                "Cash",
                "Chargeable",
                "Cost of Goods Sold",
                "Depreciation",
                "Equity",
                "Expense Account",
                "Expenses Included In Valuation",
                "Fixed Asset",
                "Income Account",
                "Payable",
                "Receivable",
                "Round Off",
                "Stock",
                "Stock Adjustment",
                "Stock Received But Not Billed",
                "Tax",
                "Temporary"
            ]
        },
        {
            "fieldname": "isGroup",
            "label": "Is Group",
            "fieldtype": "Check"
        }
    ],

    events: {
        validate: (doc) => {

        }
    },

    listSettings: {
        getFields(list)  {
            return ['name', 'accountType', 'rootType'];
        },
        getRowHTML(list, data) {
            return `<div class="col-11">${list.getNameHTML(data)} (${data.rootType})</div>`;
        }
    },

    treeSettings: {
        parentField: 'parentAccount',
        async getRootLabel() {
            let accountingSettings = await frappe.getSingle('AccountingSettings');
            return accountingSettings.companyName;
        }
    }
}
