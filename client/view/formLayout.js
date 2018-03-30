const controls = require('./controls');
const Observable = require('frappejs/utils/observable');

module.exports = class FormLayout extends Observable {
    constructor({fields, layout, events = []}) {
        super();
        Object.assign(this, arguments[0]);
        this.controls = {};
        this.controlList = [];
        this.sections = [];
        this.links = [];

        this.doc = {
            get(fieldname) {
                return this[fieldname]
            },

            set(fieldname, value) {
                this[fieldname] = value;
            }
        };

        this.form = document.createElement('div');
        this.form.classList.add('form-body');

        this.makeLayout();
        this.bindEvents(this.doc);
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