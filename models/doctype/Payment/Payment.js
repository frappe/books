module.exports = {
    name: "Payment",
    label: "Payment",
    naming: "name", // {random|autoincrement}
    isSingle: 0,
    isChild: 0,
    keywordFields: [],
    fields: [
        {
            "fieldname": "date",
            "label": "Date",
            "fieldtype": "Date"
        },
        {
            fieldname: "party",
            label: "Party",
            fieldtype: "Link",
            target: "Party",
            required: 1
        },
        {
            fieldname: "account",
            label: "Account",
            fieldtype: "Link",
            target: "Account",
            required: 1
        },
        {
            fieldname: "paymentAccount",
            label: "Payment Account",
            fieldtype: "Link",
            target: "Account",
            required: 1
        },
        {
            fieldname: "amount",
            label: "Amount",
            fieldtype: "Currency",
            required: 1,
            disabled: true,
            formula: (doc) => doc.getSum('for', 'amount')
        },
        {
            fieldname: "writeoff",
            label: "Write Off / Refund",
            fieldtype: "Currency",
        },
        {
            fieldname: "for",
            label: "Payment For",
            fieldtype: "Table",
            childtype: "PaymentFor",
            required: 1
        }
    ],

    layout: [
        {
            columns: [
                { fields: ['date', 'party'] },
                { fields: ['account', 'paymentAccount'] },
            ]
        },
        {
            fields: ['for']
        },
        {
            fields: ['amount', 'writeoff']
        }
    ]
}