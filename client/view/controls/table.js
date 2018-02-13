const frappe = require('frappejs');
const BaseControl = require('./base');
const DataTable = require('frappe-datatable');
const controls = require('./index');
const Modal = require('frappejs/client/ui/modal');

class TableControl extends BaseControl {
    make() {
        if (!this.datatable) {
            this.wrapper = frappe.ui.add('div', 'table-wrapper', this.get_input_parent());
            this.wrapper.innerHTML =
            `<div class="datatable-wrapper"></div>
            <div class="table-toolbar">
                <button type="button" class="btn btn-sm btn-outline-secondary btn-add">
                    ${frappe._("Add")}</button>
                <button type="button" class="btn btn-sm btn-outline-secondary btn-remove">
                    ${frappe._("Remove")}</button>
            </div>`;

            this.datatable = new DataTable(this.wrapper.querySelector('.datatable-wrapper'), {
                columns: this.getColumns(),
                data: this.getTableData(),
                takeAvailableSpace: true,
                addCheckboxColumn: true,
                editing: this.getTableInput.bind(this),
            });

            this.wrapper.querySelector('.btn-add').addEventListener('click', async (event) => {
                this.doc[this.fieldname].push({});
                await this.doc.commit();
                this.refresh();
            });

            this.wrapper.querySelector('.btn-remove').addEventListener('click', async (event) => {
                let checked = this.datatable.rowmanager.getCheckedRows();
                this.doc[this.fieldname] = this.doc[this.fieldname].filter(d => !checked.includes(d.idx));
                await this.doc.commit();
                this.refresh();
                this.datatable.rowmanager.checkAll(false);
            });
        }
    }

    getInputValue() {
        return this.doc[this.fieldname];
    }

    setInputValue(value) {
        this.datatable.refresh(this.getTableData(value));
    }

    getTableData(value) {
        return value || this.getDefaultData();
    }

    getTableInput(colIndex, rowIndex, value, parent) {
        let field = this.datatable.getColumn(colIndex).field;

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
                column.activeControl = control;
                control.parent_control = this;
                control.doc = this.doc[this.fieldname][rowIndex];
                control.set_focus();
                return control.setInputValue(value);
            },
            setValue: async (value, rowIndex, column) => {
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

    getColumns() {
        return this.getChildFields().map(field => {
            return {
                id: field.fieldname,
                field: field,
                content: field.label,
                width: 120,
                editable: field.disabled ? false : true,
                sortable: false,
                resizable: true,
                dropdown: false,
                align: ['Int', 'Float', 'Currency'].includes(field.fieldtype) ? 'right' : 'left',
                format: (value) => frappe.format(value, field)
            }
        });
    }

    getChildFields() {
        return frappe.getMeta(this.childtype).fields.filter(f => f.hidden ? false : true);
    }

    getDefaultData() {
        // build flat table
        if (!this.doc) {
            return [];
        }
        if (!this.doc[this.fieldname]) {
            this.doc[this.fieldname] = [{idx: 0}];
        }

        return this.doc[this.fieldname];
    }

    checkValidity() {
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
};

module.exports = TableControl;