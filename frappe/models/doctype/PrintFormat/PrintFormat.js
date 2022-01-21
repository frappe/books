module.exports = {
    name: "PrintFormat",
    label: "Print Format",
    doctype: "DocType",
    isSingle: 0,
    isChild: 0,
    keywordFields: [],
    fields: [
        {
            fieldname: "name",
            label: "Name",
            fieldtype: "Data",
            required: 1
        },
        {
            fieldname: "for",
            label: "For",
            fieldtype: "Data",
            required: 1
        },
        {
            fieldname: "template",
            label: "Template",
            fieldtype: "Code",
            required: 1,
            options: {
                mode: 'text/html'
            }
        }
    ]
}