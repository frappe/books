const frappe = require('frappejs');

class BaseControl {
    constructor(docfield, form) {
        Object.assign(this, docfield);
        this.form = form;
        if (!this.fieldname) {
            this.fieldname = frappe.slug(this.label);
        }
        this.parent = form.form;
        if (this.setup) {
            this.setup();
        }
    }

    bind(doc) {
        this.doc = doc;
        this.set_doc_value();
    }

    refresh() {
        this.make();
        this.set_doc_value();
    }

    set_doc_value() {
        if (this.doc) {
            this.set_input_value(this.doc.get(this.fieldname));
        }
    }

    make() {
        if (!this.form_group) {
            this.make_form_group();
            this.make_label();
            this.make_input();
            this.set_input_name();
            this.make_description();
            this.bind_change_event();
        }
    }

    make_form_group() {
        this.form_group = frappe.ui.add('div', 'form-group', this.parent);
    }

    make_label() {
        this.label_element = frappe.ui.add('label', null, this.form_group);
        this.label_element.textContent = this.label;
    }

    make_input() {
        this.input = frappe.ui.add('input', 'form-control', this.form_group);
        this.input.setAttribute('autocomplete', 'off');
    }

    set_input_name() {
        this.input.setAttribute('name', this.fieldname);
    }

    make_description() {
        if (this.description) {
            this.description_element = frappe.ui.add('small', 'form-text text-muted', this.form_group);
            this.description_element.textContent = this.description;
        }
    }

    set_input_value(value) {
        this.input.value = this.format(value);
    }

    format(value) {
        if (value === undefined || value === null) {
            value = '';
        }
        return value;
    }

    async get_parsed_value() {
        return await this.parse(this.input.value);
    }

    get_input_value() {
        return this.input.value;
    }

    async parse(value) {
        return value;
    }

    async validate(value) {
        return value;
    }

    bind_change_event() {
        this.input.addEventListener('change', (e) => this.handle_change(e));
    }

    async handle_change(e) {
        let value = await this.parse(this.get_input_value());
        value = await this.validate(value);
        if (this.doc[this.fieldname] !== value) {
            await this.doc.set(this.fieldname, value);
        }
    }

    disable() {
        this.input.setAttribute('disabled', 'disabled');
    }

    enable() {
        this.input.removeAttribute('disabled');
    }
}

module.exports = BaseControl;