module.exports = {
    name: "StockEntryItem",
    doctype: "DocType",
    isChild: 1,
    naming: "autoincrement",
    fields: [
        {
            fieldname: "sourceWarehouse",
            label: "Source Warehouse",
            fieldtype: "Link",
            target: "Warehouse",
        },
        {
            fieldname: "targetWarehouse",
            label: "Target Warehouse",
            fieldtype: "Link",
            target: "Warehouse",
        },
        {
            fieldname: "itemName",
            label: "Item Name",
            fieldtype: "Link",
            target: "Item"
        },
        {
            fieldname: "quantity",
            label: "Quantity",
            fieldtype: "Float"
        }
    ]
}