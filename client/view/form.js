const frappe = require('frappejs');
const controls = require('./controls');
const Observable = require('frappejs/utils/observable');
const keyboard = require('frappejs/client/ui/keyboard');

module.exports = class BaseForm extends Observable {
    constructor({doctype, parent, submit_label='Submit', container}) {
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

        this.form = frappe.ui.add('form', 'form-container', this.body);
        this.form.onValidate = true;

        this.makeControls();
        this.bindKeyboard();
    }

    makeControls() {
        for(let field of this.meta.fields) {
            if (!field.hidden && controls.getControlClass(field.fieldtype)) {
                let control = controls.makeControl({field: field, form: this});
                this.controlList.push(control);
                this.controls[field.fieldname] = control;
            }
        }
    }

    makeToolbar() {
        if (this.actions.includes('submit')) {
            this.btnSubmit = this.container.addButton(frappe._("Save"), 'primary', async (event) => {
                await this.submit();
            })
        }

        if (this.actions.includes('delete')) {
            this.btnDelete = this.container.addButton(frappe._("Delete"), 'secondary', async (e) => {
                await this.doc.delete();
                this.showAlert('Deleted', 'success');
                this.trigger('delete');
            });
        }
    }

    bindKeyboard() {
        keyboard.bindKey(this.form, 'ctrl+s', (e) => {
            if (document.activeElement) {
                document.activeElement.blur();
            }
            e.preventDefault();
            this.submit();
        });
    }

    async setDoc(doctype, name) {
        this.doc = await frappe.getDoc(doctype, name);
        this.bindEvents(this.doc);
        if (this.doc._notInserted && !this.doc._nameCleared) {
            this.doc._nameCleared = true;
            // flag so that name is cleared only once
            await this.doc.set('name', '');
        }
    }

    async bindEvents(doc) {
        if (this.doc) {
            // clear handlers of outgoing doc
            this.doc.clearHandlers();
        }
        this.clearAlert();
        this.doc = doc;
        for (let control of this.controlList) {
            control.bind(this.doc);
        }

        this.setupChangeHandler();
        this.trigger('use', {doc:doc});
    }

    setupChangeHandler() {
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
            this.form.classList.remove('was-validated');
        });
    }

    checkValidity() {
        let validity = this.form.checkValidity();
        if (validity) {
            for (let control of this.controlList) {
                // check validity in table
                if (control.fieldtype==='Table') {
                    validity = control.checkValidity();
                    if (!validity) {
                        break;
                    }
                }
            }
        }
        return validity;
    }

    async submit() {
        if (!this.checkValidity()) {
            this.form.classList.add('was-validated');
            return;
        }
        try {
            if (this.doc._notInserted) {
                await this.doc.insert();
            } else {
                await this.doc.update();
            }
            await this.refresh();
            this.showAlert('Saved', 'success');
        } catch (e) {
            this.showAlert('Failed', 'danger');
            return;
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