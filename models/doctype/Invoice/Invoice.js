const frappe = require('frappejs');

module.exports = {
    "name": "Invoice",
    "doctype": "DocType",
    "documentClass": require("./InvoiceDocument.js"),
    "print": {
        "printFormat": "Standard Invoice Format",
    },
    "isSingle": 0,
    "isChild": 0,
    "isSubmittable": 1,
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
            "target": "Party",
            "required": 1
        },
        {
            "fieldname": "account",
            "label": "Account",
            "fieldtype": "Link",
            "target": "Account"
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
            "label": "Net Total",
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
                                    ${frappe.format(row.amount, 'Currency')}
                                </div>
                            </div>`
                        }).join('')}
                    </div></div>`;
            }
        },
        {
            "fieldname": "grandTotal",
            "label": "Grand Total",
            "fieldtype": "Currency",
            formula: (doc) => doc.getGrandTotal(),
            "disabled": true
        },
        {
            "fieldname": "terms",
            "label": "Terms",
            "fieldtype": "Text"
        }
    ],

    layout: [
        // section 1
        {
            columns: [
                { fields: [ "customer", "account" ] },
                { fields: [ "date" ] }
            ]
        },

        // section 2
        { fields: [ "items" ] },

        // section 3
        { fields: [ "netTotal", "taxes", "grandTotal" ] },

        // section 4
        { fields: [ "terms" ] },
    ],

    links: [
        {
            label: 'Ledger Entries',
            condition: form => form.doc.submitted,
            action: form => {
                return {
                    route: ['table', 'AccountingLedgerEntry'],
                    params: {
                        filters: {
                            referenceType: 'Invoice',
                            referenceName: form.doc.name
                        }
                    }
                };
            }
        },
        {
            label: 'Make Payment',
            condition: form => form.doc.submitted,
            action: async form => {
                const payment = await frappe.getNewDoc('Payment');
                payment.party = form.doc.customer,
                payment.account = form.doc.account,
                payment.for = [{referenceType: form.doc.doctype, referenceName: form.doc.name, amount: form.doc.grandTotal}]
                const formModal = await frappe.desk.showFormModal('Payment', payment.name);
            }
        }
    ],

    listSettings: {
        getFields(list)  {
            return ['name', 'customer', 'grandTotal', 'submitted'];
        },

        getRowHTML(list, data) {
            return `<div class="col-3">${list.getNameHTML(data)}</div>
                    <div class="col-4 text-muted">${data.customer}</div>
                    <div class="col-4 text-muted text-right">${frappe.format(data.grandTotal, "Currency")}</div>`;
        }
    }
}