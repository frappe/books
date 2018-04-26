module.exports = {
    name: "BillItem",
    doctype: "DocType",
    isSingle: 0,
    isChild: 1,
    keywordFields: [],
    layout: 'ratio',
    fields: [
        {
            "fieldname": "item",
            "label": "Item",
            "fieldtype": "Link",
            "target": "Item",
            "required": 1,
            width: 2
        },
        {
            "fieldname": "description",
            "label": "Description",
            "fieldtype": "Text",
            formula: (row, doc) => doc.getFrom('Item', row.item, 'description'),
            hidden: 1
        },
        {
            "fieldname": "quantity",
            "label": "Quantity",
            "fieldtype": "Float",
            "required": 1
        },
        {
            "fieldname": "rate",
            "label": "Rate",
            "fieldtype": "Currency",
            "required": 1,
            formula: (row, doc) => doc.getFrom('Item', row.item, 'rate')
        },
        {
            fieldname: "account",
            label: "Account",
            hidden: 1,
            fieldtype: "Link",
            target: "Account",
            formula: (row, doc) => doc.getFrom('Item', row.item, 'expenseAccount')
        },
        {
            "fieldname": "tax",
            "label": "Tax",
            "fieldtype": "Link",
            "target": "Tax",
            formula: (row, doc) => doc.getFrom('Item', row.item, 'tax')
        },
        {
            "fieldname": "amount",
            "label": "Amount",
            "fieldtype": "Currency",
            "disabled": 1,
            formula: (row, doc) => row.quantity * row.rate
        },
        {
            "fieldname": "taxAmount",
            "label": "Tax Amount",
            "hidden": 1,
            "fieldtype": "Text",
            formula: (row, doc) => doc.getRowTax(row)
        }
    ]
}