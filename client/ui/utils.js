const frappe = require('frappejs');

module.exports = {
    convertFieldsToDatatableColumns(fields, layout = 'fixed') {
        return fields.map(field => {
            if (!field.width) {
                if (layout==='ratio') {
                    field.width = 1;
                } else if (layout==='fixed') {
                    field.width = 120;
                }
            }
            return {
                id: field.fieldname || frappe.slug(field.label),
                field: field,
                content: field.label,
                editable: true,
                sortable: false,
                resizable: true,
                dropdown: false,
                width: field.width,
                align: ['Int', 'Float', 'Currency'].includes(field.fieldtype) ? 'right' : 'left',
                format: (value) => frappe.format(value, field)
            }
        });

    }
}