const controls = require('./controls');

module.exports = class FormLayout {
	constructor({fields, layout}) {
		this.fields = fields;
		this.layout = layout;

		this.controls = {};
        this.controlList = [];
		this.sections = [];

		this.form = document.createElement('div');

		this.makeLayout();
	}

	makeLayout() {
        if (this.layout) {
            for (let section of this.layout) {
                this.makeSection(section);
            }
        } else {
            this.makeControls(this.fields);
        }
    }

    makeSection(section) {
        const sectionElement = frappe.ui.add('div', 'form-section', this.form);
        if (section.columns) {
            sectionElement.classList.add('row');
            for (let column of section.columns) {
                let columnElement = frappe.ui.add('div', 'col', sectionElement);
                this.makeControls(this.getFieldsFromLayoutElement(column.fields), columnElement);
            }
        } else {
            this.makeControls(this.getFieldsFromLayoutElement(section.fields), sectionElement);
        }
        this.sections.push(sectionElement);
    }

    getFieldsFromLayoutElement(fields) {
        return this.fields.filter(d => fields.includes(d.fieldname));
    }

    makeControls(fields, parent) {
        for(let field of fields) {
            if (!field.hidden && controls.getControlClass(field.fieldtype)) {
                let control = controls.makeControl({field: field, form: this, parent: parent});
                this.controlList.push(control);
                this.controls[field.fieldname] = control;
            }
        }
    }
}