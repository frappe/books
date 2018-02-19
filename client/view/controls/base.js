const frappe = require('frappejs');

class BaseControl {
    constructor({field, parent, form}) {
        BaseControl.count++;

        Object.assign(this, field);
        this.parent = parent;
        this.form = form;
        this.id = 'control-' + BaseControl.count;

        if (!this.fieldname) {
            this.fieldname = frappe.slug(this.label);
        }
        if (!this.parent) {
            this.parent = this.form.form;
        }
        if (this.setup) {
            this.setup();
        }
        if (this.template) {
            this.wrapper = frappe.ui.add('div', 'field-template', this.parent);
            this.renderTemplate();
        } else {
            this.make();
        }
    }

    bind(doc) {
        this.doc = doc;
        this.refresh();
    }

    refresh() {
        if (this.template) {
            this.renderTemplate();
        } else {
            this.setDocValue();
        }
    }

    renderTemplate() {
        if (this.form.doc) {
            this.wrapper.innerHTML = this.template(this.form.doc, this.doc);
        } else {
            this.wrapper.innerHTML = '';
        }
    }

    setDocValue() {
        if (this.doc && !this.template) {
            this.setInputValue(this.doc.get(this.fieldname));
        }
    }

    make() {
        if (!this.onlyInput) {
            this.makeFormGroup();
            this.makeLabel();
        }
        this.makeInput();
        this.setInputName();
        this.setRequiredAttribute();
        this.setDisabled();
        if (!this.onlyInput) {
            this.makeDescription();
        }
        this.addChangeHandler();
    }

    makeFormGroup() {
        this.formGroup = frappe.ui.add('div', 'form-group', this.parent);
    }

    makeLabel() {
        this.labelElement = frappe.ui.add('label', null, this.formGroup);
        this.labelElement.textContent = this.label;
        this.labelElement.setAttribute('for', this.id);
    }

    makeInput() {
        this.input = frappe.ui.add('input', 'form-control', this.getInputParent());
        this.input.autocomplete = "off";
        this.input.id = this.id;
    }

    setDisabled() {
        if (this.readonly || this.disabled) {
            this.input.disabled = true;
        }
    }

    getInputParent() {
        return this.formGroup || this.parent;
    }

    setInputName() {
        this.input.setAttribute('name', this.fieldname);
    }

    setRequiredAttribute() {
        if (this.required) {
            this.input.required = true;
            this.input.classList.add('font-weight-bold');
        }
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

    addChangeHandler() {
        this.input.addEventListener('change', () => {
            if (this.skipChangeEvent) return;
            this.handleChange();
        });
    }

    async handleChange(event) {
        let value = await this.parse(this.getInputValue());
        value = await this.validate(value);
        await this.updateDocValue(value);
    }

    async updateDocValue(value) {
        if (this.doc[this.fieldname] !== value) {
            if (this.parentControl) {
                // its a child
                this.doc[this.fieldname] = value;
                await this.parentControl.doc.applyChange(this.fieldname);
            } else {
                // parent
                await this.doc.set(this.fieldname, value);
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

BaseControl.count = 0;

module.exports = BaseControl;