const frappe = require('frappejs');

module.exports = {
    "name": "Invoice",
    "doctype": "DocType",
    "documentClass": require("./InvoiceDocument.js"),
    "isSingle": 0,
    "istable": 0,
    "keywordFields": ["name", "customer"],
    "settings": "InvoiceSettings",
    "showTitle": true,
    "fields": [
        {
            "fieldname": "date",
            "label": "Date",
            "fieldtype": "Date"
        },
        {
            "fieldname": "customer",
            "label": "Customer",
            "fieldtype": "Link",
            "target": "Customer",
            "required": 1
        },
        {
            "fieldname": "items",
            "label": "Items",
            "fieldtype": "Table",
            "childtype": "InvoiceItem",
            "required": true
        },
        {
            "fieldname": "netTotal",
            "label": "Total",
            "fieldtype": "Currency",
            formula: (doc) => doc.getSum('items', 'amount'),
            "disabled": true
        },
        {
            "fieldname": "taxes",
            "label": "Taxes",
            "fieldtype": "Table",
            "childtype": "TaxSummary",
            "disabled": true,
            template: (doc, row) => {
                return `<div class='row'>
                    <div class='col-6'><!-- empty left side --></div>
                    <div class='col-6'>${(doc.taxes || []).map(row => {
                        return `<div class='row'>
                                <div class='col-6'>${row.account} (${row.rate}%)</div>
                                <div class='col-6 text-right'>
                                    ${frappe.format(row.amount, {fieldtype:'Currency'})}
                                </div>
                            </div>`
                        }).join('')}
                    </div></div>`;
            }
        },
        {
            "fieldname": "grandTotal",
            "label": "Total",
            "fieldtype": "Currency",
            formula: (doc) => doc.getGrandTotal(),
            "disabled": true
        }
    ]
}