
const frappe = require('frappejs');
const utils = require('../../../accounting/utils');

module.exports = {
    name: "Fulfillment",
    label: "Fulfillment",
    doctype: 'DocType',
    documentClass: require('./FulfillmentDocument.js'),
    print: {
        printFormat: 'Standard Invoice Format'
    },
    isSingle: 0,
    isChild: 0,
    isSubmittable: 1,
    keywordFields: ['name'],
    settings: "FulfillmentSettings",
    showTitle: true,
    fields: [
        {
            fieldname: 'date',
            label: 'Date',
            fieldtype: 'Date'
        },
        {
            fieldname: 'items',
            label: 'Items',
            fieldtype: 'Table',
            childtype: "FulfillmentItem",
            required: true
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
                { fields: ['terms'] }
            ]
        }
    ],

};
