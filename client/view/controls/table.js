const frappe = require('frappejs');
const BaseControl = require('./base');
const ModelTable = require('frappejs/client/ui/modelTable');

class TableControl extends BaseControl {
    make() {
        this.makeWrapper();
        this.modelTable = new ModelTable({
            doctype: this.childtype,
            parent: this.wrapper.querySelector('.datatable-wrapper'),
            parentControl: this,
            layout: this.layout || 'fixed',
            getRowDoc: (rowIndex) => this.doc[this.fieldname][rowIndex],
            isDisabled: () => this.isDisabled()
        });
        this.setupToolbar();
    }

    makeWrapper() {
        this.wrapper = frappe.ui.add('div', 'table-wrapper', this.getInputParent());
        this.wrapper.innerHTML =
        `<div class="datatable-wrapper"></div>
        <div class="table-toolbar">
            <button type="button" class="btn btn-sm btn-outline-secondary btn-add">
                ${frappe._("Add")}</button>
            <button type="button" class="btn btn-sm btn-outline-secondary btn-remove">
                ${frappe._("Remove")}</button>
        </div>`;
    }

    setupToolbar() {
        this.wrapper.querySelector('.btn-add').addEventListener('click', async (event) => {
            this.doc[this.fieldname].push({});
            await this.doc.commit();
            this.refresh();
        });

        this.wrapper.querySelector('.btn-remove').addEventListener('click', async (event) => {
            let checked = this.modelTable.getChecked();
            this.doc[this.fieldname] = this.doc[this.fieldname].filter(d => !checked.includes(d.idx));
            await this.doc.commit();
            this.refresh();
            this.modelTable.checkAll(false);
        });
    }

    getInputValue() {
        return this.doc[this.fieldname];
    }

    setInputValue(value) {
        this.modelTable.refresh(this.getTableData(value));
    }

    setDisabled() {
        this.refreshToolbar();
    }

    getToolbar() {
        return this.wrapper.querySelector('.table-toolbar');
    }

    refreshToolbar() {
        const toolbar = this.wrapper.querySelector('.table-toolbar');
        if (toolbar) {
            toolbar.classList.toggle('hide', this.isDisabled() ? true : false);
        }
    }

    getTableData(value) {
        return value || this.getDefaultData();
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
        if (!this.modelTable) {
            return true;
        }
        return this.modelTable.checkValidity();
    }
};

module.exports = TableControl;