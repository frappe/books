const frappe = require('frappejs');
const DataTable = require('frappe-datatable');

const Modal = require('frappejs/client/ui/modal');
const utils = require('./utils');

module.exports = class ModelTable {
    constructor({doctype, parent, layout, parentControl, getRowData,
        isDisabled, getTableData}) {
        Object.assign(this, arguments[0]);
        this.meta = frappe.getMeta(this.doctype);
        this.make();
    }

    make() {
        this.datatable = new DataTable(this.parent, {
            columns: this.getColumns(),
            data: [],
            layout: this.meta.layout || this.layout || 'fluid',
            addCheckboxColumn: true,
            getEditor: this.getTableInput.bind(this),
        });
    }

    resize() {
        this.datatable.setDimensions();
    }

    getColumns() {
        return utils.convertFieldsToDatatableColumns(this.getTableFields(), this.layout);
    }

    getTableFields() {
        return this.meta.fields.filter(f => f.hidden ? false : true);
    }

    getTableInput(colIndex, rowIndex, value, parent) {
        let field = this.datatable.getColumn(colIndex).field;
        if (field.disabled || (this.isDisabled && this.isDisabled())) {
            return false;
        }

        if (field.fieldtype==='Text') {
            // text in modal
            parent = this.getControlModal(field).getBody();
        }
        const editor = this.getControl(field, parent);
        return editor;
    }

    getControl(field, parent) {
        field.onlyInput = true;
        const controls = require('frappejs/client/view/controls');
        const control = controls.makeControl({field: field, parent: parent});

        // change will be triggered by datatable
        control.skipChangeEvent = true;

        return {
            initValue: async (value, rowIndex, column) => {
                column.activeControl = control;
                control.parentControl = this.parentControl;
                control.doc = await this.getRowData(rowIndex);
                control.setFocus();
                control.setInputValue(control.doc[column.id]);
                return control;
            },
            setValue: async (value, rowIndex, column) => {
                await this.setValue(control);
            },
            getValue: () => {
                return control.getInputValue();
            }
        }

    }

    async setValue(control) {
        await control.handleChange();
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
