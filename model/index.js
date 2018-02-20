const frappe = require('frappejs');

module.exports = {
    async getSeriesNext(prefix) {
        let series;
        try {
            series = await frappe.getDoc('NumberSeries', prefix);
        } catch (e) {
            if (!e.status_code || e.status_code !== 404) {
                throw e;
            }
            series = frappe.newDoc({doctype: 'NumberSeries', name: prefix, current: 0});
            await series.insert();
        }
        let next = await series.next()
        return prefix + next;
    },
    common_fields: [
        {
            fieldname: 'name', fieldtype: 'Data', required: 1
        }
    ],
    parent_fields: [
        {
            fieldname: 'owner', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'modifieldBy', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'creation', fieldtype: 'Datetime', required: 1
        },
        {
            fieldname: 'modified', fieldtype: 'Datetime', required: 1
        },
        {
            fieldname: 'keywords', fieldtype: 'Text'
        },
        {
            fieldname: 'docstatus', fieldtype: 'Int', required: 1, default: 0
        }
    ],
    child_fields: [
        {
            fieldname: 'idx', fieldtype: 'Int', required: 1
        },
        {
            fieldname: 'parent', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'parenttype', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'parentfield', fieldtype: 'Data', required: 1
        }
    ]
};