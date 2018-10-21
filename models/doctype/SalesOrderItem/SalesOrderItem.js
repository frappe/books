const frappe = require('frappejs');
module.exports = {
    name: 'SalesOrderItem',
    doctype: 'DocType',
    isSingle: 0,
    isChild: 1,
    keywordFields: [],
    layout: 'ratio',
    fields: [
        {
            fieldname: 'item',
            label: 'Item',
            fieldtype: 'Link',
            target: 'Item',
            required: 1,
            width: 2
        },
        {
            fieldname: 'quantity',
            label: 'Quantity',
            fieldtype: 'Float',
            required: 1
        },
        {
            fieldname: 'rate',
            label: 'Rate',
            fieldtype: 'Currency',
            required: 1,
            formula: async (row, doc) => await frappe.db.getValue('Item', row.item, 'rate')
        },
        {
            fieldname: 'amount',
            label: 'Amount',
            fieldtype: 'Currency',
            disabled: 1,
            formula: (row, doc) => row.quantity * row.rate
        },
        {
            fieldname: 'itemsRemaining',
            label: 'Items Remaining',
            fieldtype: 'Float',
            disabled: true,
            formula: async (row, doc) => {
                if(row.quantity){
                    let fItems = await frappe.db.getAll({
                        doctype: 'FulfillmentItem',
                        fields: ['*'],
                        orderBy: 'name',
                        order: 'asc',
                    });
                    let delivered = 0;
                    if(row.parent) {
                        fItems = fItems.filter((i) => (i.salesOrder == row.parent))
                        fItems = fItems.filter((i) => (i.item == row.item))
                        delivered = fItems.reduce((acc, i) => acc + i.quantity, 0);
                    }
                    return (row.quantity - delivered);
                }
            }
        },
    ]
};
