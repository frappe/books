module.exports = {
    name: "StockEntry",
    label: "Stock Entry",
    doctype: "DocType",
    settings: 'StockEntrySettings',
    documentClass: require("./StockEntryDocument.js"),
    pageSettings: {
        hideTitle: true
    },
    fields: [
        {
            fieldname: "date",
            label: "Date",
            fieldtype: "Date",
            required: 1
        },
        {
            fieldname: "items",
            label: "Entries",
            fieldtype: "Table",
            childtype: "StockEntryItem"
        }
    ],
    keywordFields: [],
    isSingle: 0,
    listSettings: {
        getFields(list) {
            return ["date", "sourceWarehouse","targetWarehouse"];
        },
        getRowHTML(list, data) {
            return `<div class="col-11">${data.date} (${data.sourceWarehouse} ➤ ${data.targetWarehouse})</div>`;
        }
    },


}