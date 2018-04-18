module.exports = {
    name: "AccountingLedgerEntry",
    label: "Ledger Entry",
    naming: "autoincrement",
    doctype: "DocType",
    isSingle: 0,
    isChild: 0,
    keywordFields: [
        'account',
        'party',
        'referenceName'
    ],
    fields: [
        {
            fieldname: "date",
            label: "Date",
            fieldtype: "Date"
        },
        {
            fieldname: "account",
            label: "Account",
            fieldtype: "Link",
            target: "Account",
            required: 1
        },
        {
            fieldname: "description",
            label: "Description",
            fieldtype: "Text"
        },
        {
            fieldname: "party",
            label: "Party",
            fieldtype: "Link",
            target: "Party",
            required: 1
        },
        {
            fieldname: "debit",
            label: "Debit",
            fieldtype: "Currency",
        },
        {
            fieldname: "credit",
            label: "Credit",
            fieldtype: "Currency",
        },
        {
            fieldname: "againstAccount",
            label: "Against Account",
            fieldtype: "Text",
            required: 0
        },
        {
            fieldname: "referenceType",
            label: "Reference Type",
            fieldtype: "Data",
        },
        {
            fieldname: "referenceName",
            label: "Reference Name",
            fieldtype: "DynamicLink",
            references: "referenceType"
        },
        {
            fieldname: "balance",
            label: "Balance",
            fieldtype: "Currency",
        },
    ]
}