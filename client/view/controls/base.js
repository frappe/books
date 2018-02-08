const frappe = require('frappejs');

class BaseControl {
    constructor({field, parent, form}) {
        Object.assign(this, field);
        this.parent = parent;
        this.form = form;

        if (!this.fieldname) {
            this.fieldname = frappe.slug(this.label);
        }
        if (!this.parent) {
            this.parent = this.form.form;
        }
        if (this.setup) {
            this.setup();
        }
    }

    bind(doc) {
        this.doc = doc;
        this.setDocValue();
    }

    refresh() {
        this.make();
        this.setDocValue();
    }

    setDocValue() {
        if (this.doc) {
            this.setInputValue(this.doc.get(this.fieldname));
        }
    }

    make() {
        if (!this.input) {
            if (!this.onlyInput) {
                this.makeFormGroup();
                this.makeLabel();
            }
            this.makeInput();
            this.setInputName();
            if (!this.onlyInput) {
                this.makeDescription();
            }
            this.bindChangeEvent();
        }
    }

    makeFormGroup() {
        this.formGroup = frappe.ui.add('div', 'form-group', this.parent);
    }

    makeLabel() {
        this.label_element = frappe.ui.add('label', null, this.formGroup);
        this.label_element.textContent = this.label;
    }

    makeInput() {
        this.input = frappe.ui.add('input', 'form-control', this.get_input_parent());
        this.input.setAttribute('autocomplete', 'off');
    }

    get_input_parent() {
        return this.formGroup || this.parent;
    }

    setInputName() {
        this.input.setAttribute('name', this.fieldname);
    }

    makeDescription() {
        if (this.description) {
            this.description_element = frappe.ui.add('small', 'form-text text-muted', this.formGroup);
            this.description_element.textContent = this.description;
        }
    }

    setInputValue(value) {
        this.input.value = this.format(value);
    }

    format(value) {
        if (value === undefined || value === null) {
            value = '';
        }
        return value;
    }

    async getParsedValue() {
        return await this.parse(this.input.value);
    }

    getInputValue() {
        return this.input.value;
    }

    async parse(value) {
        return value;
    }

    async validate(value) {
        return value;
    }

    bindChangeEvent() {
        this.input.addEventListener('change', (e) => this.handleChange());
    }

    async handleChange() {
        let value = await this.parse(this.getInputValue());
        value = await this.validate(value);
        if (this.doc[this.fieldname] !== value) {
            if (this.doc.set) {
                await this.doc.set(this.fieldname, value);
            }
            if (this.parent_control) {
                this.doc[this.fieldname] = value;
                await this.parent_control.doc.set(this.fieldname, this.parent_control.getInputValue());
            }
        }
    }

    disable() {
        this.input.setAttribute('disabled', 'disabled');
    }

    enable() {
        this.input.removeAttribute('disabled');
    }

    set_focus() {
        this.input.focus();
    }
}

module.exports = BaseControl;