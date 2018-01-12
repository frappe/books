const frappe = require('frappe-core');
const controls = require('./controls');

class Form {
    constructor({doctype, parent, submit_label='Submit'}) {
        this.parent = parent;
        this.doctype = doctype;
        this.submit_label = submit_label;

        this.controls = {};
        this.controls_list = [];

        this.meta = frappe.get_meta(this.doctype);
        this.make();
    }

    make() {
        if (this.body || !this.parent) {
            return;
        }

        this.body = frappe.ui.add('div', 'form-body', this.parent);
        this.make_actions();

        this.form = frappe.ui.add('form', null, this.body);
        for(let df of this.meta.fields) {
            if (controls.get_control_class(df.fieldtype)) {
                let control = controls.make_control(df, this.form);
                this.controls_list.push(control);
                this.controls[df.fieldname] = control;
            }
        }
        this.make_submit();
    }

    make_actions() {
        this.toolbar = frappe.ui.add('div', 'form-toolbar', this.body);
        this.actions = frappe.ui.make_dropdown('Actions', this.toolbar);

        // delete
        this.actions.add_item('Delete', async () => {
            await this.doc.delete();
            this.show_alert('Deleted', 'success');
        });

        this.actions.float_right();
    }

    make_submit() {
        this.submit_btn = frappe.ui.add('button', 'btn btn-outline-primary',
            this.body);
        this.submit_btn.setAttribute('type', 'submit');
        this.submit_btn.textContent = this.submit_label;
        this.submit_btn.addEventListener('click', (event) => {
            this.submit();
            event.preventDefault();
        })
    }

    show_alert(message, type) {
        this.clear_alert();
        this.alert = frappe.ui.add('div', `alert alert-${type}`, this.body);
        this.alert.textContent = message;
    }

    clear_alert() {
        if (this.alert) {
            frappe.ui.remove(this.alert);
            this.alert = null;
        }
    }

    async use(doc, is_new = false) {
        if (this.doc) {
            // clear handlers of outgoing doc
            this.doc.clear_handlers();
        }
        this.clear_alert();
        this.doc = doc;
        this.is_new = is_new;
        for (let control of this.controls_list) {
            control.bind(this.doc);
        }
    }

    async submit() {
        try {
            if (this.is_new) {
                await this.doc.insert();
            } else {
                await this.doc.update();
            }
            await this.refresh();
            this.show_alert('Saved', 'success');
        } catch (e) {
            this.show_alert('Failed', 'danger');
        }
    }

    refresh() {
        for(let control of this.controls_list) {
            control.refresh();
        }
    }

}

module.exports = {Form: Form};