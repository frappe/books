module.exports = {
    name: 'FulfillmentItem',
    doctype: 'DocType',
    isSingle: 0,
    isChild: 1,
    keywordFields: [],
    layout: 'ratio',
    fields: [
        {
            fieldname: 'salesOrder',
            label: 'Sales Order',
            fieldtype: 'Link',
            target: 'SalesOrder',
            required: 1
        },
        {
            fieldname: 'item',
            label: 'Item',
            fieldtype: 'Link',
            target: 'Item',
            required: 1
        },
        {
            fieldname: 'quantity',
            label: 'Quantity',
            fieldtype: 'Float',
            required: 1
        }
    ]
};
