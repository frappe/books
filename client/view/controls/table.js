const frappe = require('frappejs');
const BaseControl = require('./base');
const DataTable = require('frappe-datatable');
const controls = require('./index');

class TableControl extends BaseControl {
    make() {
        if (!this.datatable) {
            this.wrapper = frappe.ui.add('div', 'datatable-wrapper', this.get_input_parent());
            this.datatable = new DataTable(this.wrapper, {
                columns: this.get_columns(),
                data: this.get_table_data(),
                takeAvailableSpace: true,
                enableClusterize: true,
                editing: this.get_table_input.bind(this),

            });
            this.datatable.datatableWrapper.style = 'height: 300px';
        }
    }

    get_input_value() {
        return this.doc[this.fieldname];
    }

    set_input_value(value) {
        this.datatable.refresh(this.get_table_data(value));
    }

    get_table_data(value) {
        return value || this.get_default_data();
    }

    get_table_input(colIndex, rowIndex, value, parent) {
        let field = this.datatable.getColumn(colIndex).field;
        field.only_input = true;
        const control = controls.make_control({field: field, parent: parent});

        return {
            initValue: (value, rowIndex, column) => {
                control.parent_control = this;
                control.doc = this.doc[this.fieldname][rowIndex];
                control.set_focus();
                return control.set_input_value(value);
            },
            setValue: (value, rowIndex, column) => {
                return control.set_input_value(value);
            },
            getValue: () => {
                return control.get_input_value();
            }
        }
    }

    get_columns() {
        return this.get_child_fields().map(field => {
            return {
                id: field.fieldname,
                field: field,
                content: field.label,
                editable: true,
                width: 120,
                align: ['Int', 'Float', 'Currency'].includes(field.fieldtype) ? 'right' : 'left',
                format: (value) => frappe.format(value, field)
            }
        });
    }

    get_child_fields() {
        return frappe.get_meta(this.childtype).fields;
    }

    get_default_data() {
        // build flat table
        if (!this.doc) {
            return [];
        }
        if (!this.doc[this.fieldname]) {
            this.doc[this.fieldname] = [{}];
        }

        return this.doc[this.fieldname];
    }
};

module.exports = TableControl;