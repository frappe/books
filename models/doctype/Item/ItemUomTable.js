module.exports = {
    name: "ItemUomTable",
    doctype: "DocType",
    isChild: 1,
    fields: [
        {
            fieldname: "name",
            label: "UOM",
            fieldtype: "Link",
            target: "Uom"
        },
        {
            fieldname: "conversionFactor",
            label: "Conversion Factor",
            fieldtype: "Float"
        }
    ],
}