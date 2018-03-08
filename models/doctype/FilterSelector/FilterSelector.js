const frappe = require('frappejs');

module.exports = {
    name: "FilterSelector",
    label: "Set Filters",
    documentClass: require('./FilterSelectorDocument'),
    isSingle: 1,
    isChild: 0,
    keywordFields: [],
    fields: [
        {
            fieldname: "forDocType",
            label: "Document Type",
            fieldtype: "Data",
            hidden: 1,
        },
        {
            fieldname: "filterGroup",
            label: "Saved Filters",
            fieldtype: "Link",
            target: "FilterGroup",
            getFilters: (query, control) => {
                return {
                    forDocType: control.doc.forDocType,
                    keywords: ["like", query]
                }
            }
        },
        {
            fieldname: "filterGroupName",
            label: "New Filter Name",
            fieldtype: "Data",
        },
        {
            fieldname: "items",
            label: "Items",
            fieldtype: "Table",
            childtype: "FilterItem",
            neverEmpty: 1,

            // copy items from saved filter group
            formula: async (doc) => {
                if (doc._lastFilterGroup !== doc.filterGroup) {
                    // fitler changed

                    if (doc.filterGroup) {
                        doc.items = [];
                        const filterGroup = await frappe.getDoc('FilterGroup', doc.filterGroup);

                        // copy items
                        for(let source of filterGroup.items) {
                            const item = Object.assign({}, source);
                            item.parent = item.name = '';
                            doc.items.push(item);
                        }
                    } else {
                        // no filter group selected
                        doc.items = [{idx: 0}];
                    }

                    doc._lastFilterGroup = doc.filterGroup;
                }
                return false;
            },
        }
    ],

    formEvents: {
        // set the fields of the selected item in the 'select'
        refresh: (form) => {
            // override the `getOptions` method in the `field` property
            frappe.getMeta('FilterItem').getField('field').getOptions = () => {
                return frappe.getMeta(form.doc.forDocType).fields.map((f) => {
                    return {label: f.label, value: f.fieldname};
                });
            }
        }
    }
}