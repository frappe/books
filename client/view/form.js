const frappe = require('frappejs');
const controls = require('./controls');

module.exports = class BaseForm {
    constructor({doctype, parent, submit_label='Submit'}) {
        this.parent = parent;
        this.doctype = doctype;
        this.submit_label = submit_label;

        this.controls = {};
        this.controls_list = [];

        this.meta = frappe.get_meta(this.doctype);
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
        this.make_toolbar();

        this.form = frappe.ui.add('form', null, this.body);
        for(let df of this.meta.fields) {
            if (controls.get_control_class(df.fieldtype)) {
                let control = controls.make_control(df, this);
                this.controls_list.push(control);
                this.controls[df.fieldname] = control;
            }
        }
    }

    make_toolbar() {
        this.toolbar = frappe.ui.add('div', 'form-toolbar text-right', this.body);
        this.toolbar.innerHTML = `
            <button class="btn btn-outline-secondary btn-delete">Delete</button>
            <button class="btn btn-primary btn-submit">Save</button>
        `

        this.btn_submit = this.toolbar.querySelector('.btn-submit');;
        this.btn_submit.addEventListener('click', async (event) => {
            this.submit();
            event.preventDefault();
        })

        this.btn_delete = this.toolbar.querySelector('.btn-delete');
        this.btn_delete.addEventListener('click', async () => {
            await this.doc.delete();
            this.show_alert('Deleted', 'success');
        });
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

        // refresh value in control
        this.doc.add_handler('change', (params) => {
            let control = this.controls[params.fieldname];
            if (control && control.get_input_value() !== control.format(params.fieldname)) {
                control.set_doc_value();
            }
        });
    }

    async submit() {
        try {
            if (this.is_new || this.doc.__not_inserted) {
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