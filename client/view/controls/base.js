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
        this.setDisabled();
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
            this.makeInputContainer();
            this.makeLabel();
        }
        this.makeInput();
        this.addChangeHandler();
    }

    makeInputContainer(className = 'form-group') {
        this.inputContainer = frappe.ui.add('div', className, this.parent);
    }

    makeLabel(labelClass = null) {
        this.labelElement = frappe.ui.add('label', labelClass, this.inputContainer, this.label);
        this.labelElement.setAttribute('for', this.id);
        if (this.inline) {
            this.labelElement.classList.add("sr-only");
        }
    }

    makeInput(inputClass='form-control') {
        this.input = frappe.ui.add('input', inputClass, this.getInputParent());
        this.input.autocomplete = "off";
        this.input.id = this.id;

        this.setInputName();
        this.setRequiredAttribute();
        this.setDisabled();
        if (!this.onlyInput) {
            this.makeDescription();
        }
        if (this.placeholder) {
            this.input.setAttribute('placeholder', this.placeholder);
        }

    }

    isDisabled() {
        let disabled = this.disabled;

        if (this.doc && this.doc.submitted) {
            disabled = true;
        }

        if (this.formula && this.fieldtype !== 'Table') {
            disabled = true;
        }

        return disabled;
    }

    setDisabled() {
        this.input.disabled = this.isDisabled();
    }

    getInputParent() {
        return this.inputContainer || this.parent;
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
            this.description_element = frappe.ui.add('small', 'form-text text-muted',
                this.inputContainer, this.description);
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
        return await this.parse(this.getInputValue());
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
                this.parentControl.doc._dirty = true;
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

    setFocus() {
        this.input.focus();
    }
}

BaseControl.count = 0;

module.exports = BaseControl;