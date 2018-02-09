const frappe = require('frappejs');

module.exports = {
    async get_series_next(prefix) {
        let series;
        try {
            series = await frappe.getDoc('Number Series', prefix);
        } catch (e) {
            if (!e.status_code || e.status_code !== 404) {
                throw e;
            }
            series = frappe.newDoc({doctype: 'Number Series', name: prefix, current: 0});
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
            fieldname: 'owner', fieldtype: 'Link', required: 1, options: 'User'
        },
        {
            fieldname: 'modified_by', fieldtype: 'Link', required: 1, options: 'User'
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
            fieldname: 'parenttype', fieldtype: 'Link', required: 1, options: 'DocType'
        },
        {
            fieldname: 'parentfield', fieldtype: 'Data', required: 1
        }
    ]
};