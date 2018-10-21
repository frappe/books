const frappe = require('frappejs');
const utils = require('../../../accounting/utils');
const indicatorColor = require('frappejs/ui/constants/indicators');

module.exports = {
    name: "SalesOrder",
    label: "Sales Order",
    doctype: 'DocType',
    documentClass: require('./SalesOrderDocument.js'),
    print: {
        printFormat: 'Standard Invoice Format'
    },
    isSingle: 0,
    isChild: 0,
    isSubmittable: 1,
    keywordFields: ['name', 'customer'],
    settings: "SalesOrderSettings",
    showTitle: true,
    indicators: {
        key: 'status',
        colors: {
            "Not Delivered": indicatorColor.RED,
            "Partially Delivered": indicatorColor.ORANGE,
            "Fully Delivered": indicatorColor.GREEN
        }
    },
    fields: [{
            fieldname: 'date',
            label: 'Date',
            fieldtype: 'Date'
        },
        {
            fieldname: 'customer',
            label: 'Customer',
            fieldtype: 'Link',
            target: 'Party',
            required: 1,
            getFilters: (query, control) => {
                return {
                    keywords: ['like', query],
                    customer: 1
                };
            }
        },
        {
            fieldname: 'items',
            label: 'Items',
            fieldtype: 'Table',
            childtype: 'SalesOrderItem',
            required: true
        },
        {
            fieldname: 'netTotal',
            label: 'Net Total',
            fieldtype: 'Currency',
            formula: (doc) => doc.getSum('items', 'amount'),
            disabled: true
        },
        {
            fieldname: 'status',
            label: 'Status',
            fieldtype: 'Data',
            disabled: true,
            formula: (doc) => {
                let status = "Not Delivered";
                function checkFilled() {
                    return doc.items.reduce((acc,i)=>{
                        if(!i.quantity && !i.itemsRemaining)
                            return acc + 1;
                    }, 0);
                }
                if(!checkFilled()){
                    let totalItems = doc.items.reduce((acc, i)=>acc+i.quantity,0)
                    let remainingItems = doc.items.reduce((acc, i)=>acc+i.itemsRemaining,0)
                    if (totalItems == remainingItems)
                        status = "Not Delivered";
                    else if(remainingItems == 0)
                        status = "Fully Delivered";
                    else
                        status = "Partially Delivered";
                }
                return status;
            }
        },
        {
            fieldname: 'terms',
            label: 'Terms',
            fieldtype: 'Text'
        }
    ],

    layout: [
        // section 1
        {
            columns: [
                { fields: ['customer'] },
                { fields: ['date'] }
            ]
        },

        // section 2
        {
            columns: [
                { fields: ['items'] }
            ]
        },

        // section 3
        {
            columns: [
                { fields: ['netTotal'] }
            ]
        },

        // section 4
        {
            columns: [
                { fields: ['status'] }
            ]
        },

        // section 4
        {
            columns: [
                { fields: ['terms'] }
            ]
        }
    ],
};
