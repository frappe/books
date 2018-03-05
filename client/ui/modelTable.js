const frappe = require('frappejs');
const DataTable = require('frappe-datatable');
const controls = require('frappejs/client/view/controls');
const Modal = require('frappejs/client/ui/modal');

module.exports = class ModelTable {
    constructor({doctype, parent, layout='fixed', parentControl, getRowDoc, isDisabled}) {
        Object.assign(this, arguments[0]);
        this.meta = frappe.getMeta(this.doctype);
        this.make();
    }

    make() {
        this.datatable = new DataTable(this.parent, {
            columns: this.getColumns(),
            data: [],
            layout: this.meta.layout || 'fixed',
            addCheckboxColumn: true,
            getEditor: this.getTableInput.bind(this),
        });
    }

    getColumns() {
        return this.getTableFields().map(field => {
            if (!field.width) {
                if (this.layout==='ratio') {
                    field.width = 1;
                } else if (this.layout==='fixed') {
                    field.width = 120;
                }
            }
            return {
                id: field.fieldname,
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

    getTableFields() {
        return this.meta.fields.filter(f => f.hidden ? false : true);
    }

    getTableInput(colIndex, rowIndex, value, parent) {
        let field = this.datatable.getColumn(colIndex).field;
        if (field.disabled || field.forumla || (this.isDisabled && this.isDisabled())) {
            return false;
        }

        if (field.fieldtype==='Text') {
            // text in modal
            parent = this.getControlModal(field).getBody();
        }
        return this.getControl(field, parent);
    }

    getControl(field, parent) {
        field.onlyInput = true;
        const control = controls.makeControl({field: field, parent: parent});

        // change will be triggered by datatable
        control.skipChangeEvent = true;

        return {
            initValue: (value, rowIndex, column) => {
                let doc = this.getRowDoc(rowIndex);
                column.activeControl = control;
                control.parentControl = this.parentControl;
                control.doc = doc;
                control.set_focus();
                return control.setInputValue(control.doc[column.id]);
            },
            setValue: async (value, rowIndex, column) => {
                if (this.doc) this.doc._dirty = true;
                control.doc._dirty = true;
                control.handleChange();
            },
            getValue: () => {
                return control.getInputValue();
            }
        }

    }

    getControlModal(field) {
        this.modal = new Modal({
            title: frappe._('Edit {0}', field.label),
            body: '',
            primary: {
                label: frappe._('Submit'),
                action: (modal) => {
                    this.datatable.cellmanager.submitEditing();
                    modal.hide();
                }
            }
        });
        this.modal.on('hide', () => {
            this.datatable.cellmanager.deactivateEditing();
            this.datatable.cellmanager.$focusedCell.focus();
        });

        return this.modal;
    }

    checkValidity() {
        if (!this.datatable) {
            return true;
        }
        let data = this.getTableData();
        for (let rowIndex=0; rowIndex < data.length; rowIndex++) {
            let row = data[rowIndex];
            for (let column of this.datatable.datamanager.columns) {
                if (column.field && column.field.required) {
                    let value = row[column.field.fieldname];
                    if (value==='' || value===undefined || value===null) {
                        let $cell = this.datatable.cellmanager.getCell$(column.colIndex, rowIndex);
                        this.datatable.cellmanager.activateEditing($cell);
                        return false;
                    }
                }
            }
        }
        return true;
    }

    refresh(data) {
        return this.datatable.refresh(data);
    }

    getChecked() {
        return this.datatable.rowmanager.getCheckedRows();
    }

    checkAll(check) {
        return this.datatable.rowmanager.checkAll(check);
    }
}
