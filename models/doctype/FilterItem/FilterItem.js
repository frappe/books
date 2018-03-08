module.exports = {
    name: "FilterItem",
    doctype: "DocType",
    isSingle: 0,
    isChild: 1,
    keywordFields: [],
    fields: [
        {
            fieldname: "field",
            label: "Field",
            fieldtype: "Select",
            required: 1
        },
        {
            fieldname: "condition",
            label: "Condition",
            fieldtype: "Select",
            options: [
                'Equals',
                '>',
                '<',
                '>=',
                '<=',
                'Between',
                'Includes',
                'One Of'
            ],
            required: 1
        },
        {
            fieldname: "value",
            label: "Value",
            fieldtype: "Data",
        }
    ]
}