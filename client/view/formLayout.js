const frappe = require('frappejs');
const controls = require('./controls');
const Observable = require('frappejs/utils/observable');

module.exports = class FormLayout extends Observable {
    constructor({fields, doc, layout, inline = false, events = []}) {
        super();
        Object.assign(this, arguments[0]);
        this.controls = {};
        this.controlList = [];
        this.sections = [];
        this.links = [];

        this.form = document.createElement('div');
        this.form.classList.add('form-body');

        if (this.inline) {
            this.form.classList.add('row');
            this.form.classList.add('p-0');
        }

        this.makeLayout();

        if (doc) {
            this.bindEvents(doc);
        }
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
        const sectionHead = frappe.ui.add('div', 'form-section-head', sectionElement);
        const sectionBody = frappe.ui.add('div', 'form-section-body', sectionElement);

        if (section.title) {
            const head = frappe.ui.add('h6', 'uppercase', sectionHead);
            head.textContent = section.title;
        }

        if (section.columns) {
            sectionBody.classList.add('row');
            for (let column of section.columns) {
                let columnElement = frappe.ui.add('div', 'col', sectionBody);
                this.makeControls(this.getFieldsFromLayoutElement(column.fields), columnElement);
            }
        } else {
            this.makeControls(this.getFieldsFromLayoutElement(section.fields), sectionBody);
        }
        this.sections.push(sectionBody);
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
                if (this.inline) {
                    control.inputContainer.classList.add('col');
                }
            }
        }
    }

    async bindEvents(doc) {
        this.doc = doc;
        this.controlList.forEach(control => {
            control.bind(this.doc);
        });
        this.refresh();
    }

    refresh() {
        this.controlList.forEach(control => {
            control.refresh();
        });
    }

    bindFormEvents() {
        if (this.events) {
            for (let key in this.events) {
                this.on(key, this.events[key]);
            }
        }
    }
}