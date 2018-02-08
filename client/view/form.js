const frappe = require('frappejs');
const controls = require('./controls');
const Observable = require('frappejs/utils/observable');

module.exports = class BaseForm extends Observable {
    constructor({doctype, parent, submit_label='Submit', page}) {
        super();
        Object.assign(this, arguments[0]);
        this.controls = {};
        this.controlList = [];

        this.meta = frappe.getMeta(this.doctype);
        if (this.setup) {
            this.setup();
        }
        this.make();
    }

    make() {
        if (this.body || !this.parent) {
            return;
        }

        this.body = frappe.ui.add('div', 'form-body', this.parent);
        this.makeToolbar();

        this.form = frappe.ui.add('div', 'form-container', this.body);
        for(let field of this.meta.fields) {
            if (controls.getControlClass(field.fieldtype)) {
                let control = controls.makeControl({field: field, form: this});
                this.controlList.push(control);
                this.controls[field.fieldname] = control;
            }
        }
    }

    makeToolbar() {
        this.btnSubmit = this.page.addButton(frappe._("Save"), 'btn-primary', async () => {
            await this.submit();
        })

        this.btnDelete = this.page.addButton(frappe._("Delete"), 'btn-outline-secondary', async () => {
            await this.doc.delete();
            this.showAlert('Deleted', 'success');
            this.trigger('delete');
        });
    }

    async use(doc, is_new = false) {
        if (this.doc) {
            // clear handlers of outgoing doc
            this.doc.clearHandlers();
        }
        this.clearAlert();
        this.doc = doc;
        this.is_new = is_new;
        for (let control of this.controlList) {
            control.bind(this.doc);
        }

        // refresh value in control
        this.doc.addHandler('change', (params) => {
            if (params.fieldname) {
                // only single value changed
                let control = this.controls[params.fieldname];
                if (control && control.getInputValue() !== control.format(params.fieldname)) {
                    control.setDocValue();
                }
            } else {
                // multiple values changed
                this.refresh();
            }
        });

        this.trigger('use', {doc:doc});
    }

    async submit() {
        try {
            if (this.is_new || this.doc.__not_inserted) {
                await this.doc.insert();
            } else {
                await this.doc.update();
            }
            await this.refresh();
            this.showAlert('Saved', 'success');
        } catch (e) {
            this.showAlert('Failed', 'danger');
        }
        await this.trigger('submit');
    }

    refresh() {
        for(let control of this.controlList) {
            control.refresh();
        }
    }

    showAlert(message, type, clear_after = 5) {
        this.clearAlert();
        this.alert = frappe.ui.add('div', `alert alert-${type}`, this.body);
        this.alert.textContent = message;
        setTimeout(() => {
            this.clearAlert();
        }, clear_after * 1000);
    }

    clearAlert() {
        if (this.alert) {
            frappe.ui.remove(this.alert);
            this.alert = null;
        }
    }

}