module.exports = {
    name: "FilterGroup",
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
            fieldname: "forDocType",
            label: "Document Type",
            fieldtype: "Data",
            required: 1,
            disabled: 1,
        },
        {
            fieldname: "items",
            fieldtype: "Table",
            childtype: "FilterItem",
            label: "Items",
            required: 1
        }
   ]
}