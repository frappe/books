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
                <button class="btn btn-sm btn-outline-secondary btn-add">${frappe._("Add")}</button>
                <button class="btn btn-sm btn-outline-danger btn-remove">${frappe._("Remove")}</button>
            </div>`;

            this.datatable = new DataTable(this.wrapper.querySelector('.datatable-wrapper'), {
                columns: this.getColumns(),
                data: this.getTableData(),
                takeAvailableSpace: true,
                enableClusterize: true,
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
            return this.getControlInModal(field);
        } else {
            return this.getControl(field, parent);
        }
    }

    getControl(field, parent) {
        field.onlyInput = true;
        const control = controls.makeControl({field: field, parent: parent});

        return {
            initValue: (value, rowIndex, column) => {
                control.parent_control = this;
                control.doc = this.doc[this.fieldname][rowIndex];
                control.set_focus();
                return control.setInputValue(value);
            },
            setValue: async (value, rowIndex, column) => {
                // triggers change event
            },
            getValue: () => {
                return control.getInputValue();
            }
        }

    }

    getControlInModal(field, parent) {
        this.modal = new Modal({
            title: frappe._('Edit {0}', field.label),
            body: '',
            primary_label: frappe._('Submit'),
            primary_action: (modal) => {
                this.datatable.cellmanager.submitEditing();
                modal.hide();
            }
        });
        this.modal.$modal.on('hidden.bs.modal', () => {
            this.datatable.cellmanager.deactivateEditing();
        })

        return this.getControl(field, this.modal.get_body());
    }

    getColumns() {
        return this.getChildFields().map(field => {
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

    getChildFields() {
        return frappe.getMeta(this.childtype).fields;
    }

    getDefaultData() {
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