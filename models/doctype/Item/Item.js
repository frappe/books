module.exports = {
    name: "Item",
    doctype: "DocType",
    isSingle: 0,
    keywordFields: [
        "name",
        "description"
    ],
    fields: [
        {
            fieldname: "name",
            label: "Item Name",
            fieldtype: "Data",
            required: 1
        },
        {
            fieldname: "description",
            label: "Description",
            fieldtype: "Text"
        },
        {
            fieldname: "unit",
            label: "Unit",
            fieldtype: "Select",
            default: "No",
            options: [
                "No",
                "Kg",
                "Gram",
                "Hour",
                "Day"
            ]
        },
        {
            fieldname: "incomeAccount",
            label: "Income Account",
            fieldtype: "Link",
            target: "Account"
        },
        {
            fieldname: "expenseAccount",
            label: "Expense Account",
            fieldtype: "Link",
            target: "Account"
        },
        {
            fieldname: "tax",
            label: "Tax",
            fieldtype: "Link",
            target: "Tax"
        },
        {
            fieldname: "rate",
            label: "Rate",
            fieldtype: "Currency"
        }
    ],
    layout: [
        // section 1
        {
            columns: [
                { fields: [ "name", "unit" ] },
                { fields: [ "rate" ] }
            ]
        },

        // section 2
        { fields: [ "description" ] },

        // section 3
        {
            title: "Accounting",
            columns: [
                { fields: [ "incomeAccount", "expenseAccount" ] },
                { fields: [ "tax" ] }
            ]
        }
    ]
}