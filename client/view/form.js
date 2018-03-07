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
        this.sections = [];

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

        this.makeLayout();
        this.bindKeyboard();
    }

    makeLayout() {
        if (this.meta.layout) {
            for (let section of this.meta.layout) {
                this.makeSection(section);
            }
        } else {
            this.makeControls(this.meta.fields);
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
        return this.meta.fields.filter(d => fields.includes(d.fieldname));
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

    makeToolbar() {
        if (this.actions.includes('save')) {
            this.makeSaveButton();

            if (this.meta.isSubmittable) {
                this.makeSubmitButton();
                this.makeRevertButton();
            }
        }

        if (this.meta.print && this.actions.includes('print')) {
            let menu = this.container.getDropdown(frappe._('Menu'));
            menu.addItem(frappe._("Print"), async (e) => {
                await frappe.router.setRoute('print', this.doctype, this.doc.name);
            });
        }

        if (!this.meta.isSingle && this.actions.includes('delete')) {
            let menu = this.container.getDropdown(frappe._('Menu'));
            menu.addItem(frappe._("Delete"), async (e) => {
                await this.delete();
            });
        }

        if (!this.meta.isSingle && this.actions.includes('duplicate')) {
            let menu = this.container.getDropdown(frappe._('Menu'));
            menu.addItem(frappe._('Duplicate'), async () => {
                let newDoc = await frappe.getDuplicate(this.doc);
                await frappe.router.setRoute('edit', newDoc.doctype, newDoc.name);
                newDoc.set('name', '');
            });
        }

        if (this.meta.settings && this.actions.includes('settings')) {
            let menu = this.container.getDropdown(frappe._('Menu'));
            menu.addItem(frappe._('Settings...'), () => {
                frappe.desk.showFormModal(this.meta.settings, this.meta.settings);
            });
        }

    }

    makeSaveButton() {
        this.saveButton = this.container.addButton(frappe._("Save"), 'primary', async (event) => {
            await this.save();
        });
        this.on('change', () => {
            const show = this.doc._dirty && !this.doc.submitted;
            this.saveButton.classList.toggle('hide', !show);
        });
    }

    makeSubmitButton() {
        this.submitButton = this.container.addButton(frappe._("Submit"), 'primary', async (event) => {
            await this.submit();
        });
        this.on('change', () => {
            const show = this.meta.isSubmittable && !this.doc._dirty && !this.doc.submitted;
            this.submitButton.classList.toggle('hide', !show);
        });
    }

    makeRevertButton() {
        this.revertButton = this.container.addButton(frappe._("Revert"), 'secondary', async (event) => {
            await this.revert();
        });
        this.on('change', () => {
            const show = this.meta.isSubmittable && !this.doc._dirty && this.doc.submitted;
            this.revertButton.classList.toggle('hide', !show);
        });
    }

    bindKeyboard() {
        keyboard.bindKey(this.form, 'ctrl+s', (e) => {
            if (document.activeElement) {
                document.activeElement.blur();
            }
            e.preventDefault();
            if (this.doc._notInserted || this.doc._dirty) {
                this.save();
            } else {
                if (this.meta.isSubmittable && !this.doc.submitted) this.submit();
            }
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
        this.setTitle();
        frappe._curFrm = this;
    }

    setTitle() {
        const doctypeLabel = this.doc.meta.label || this.doc.meta.name;

        if (this.doc.meta.isSingle || this.doc.meta.naming === 'random') {
            this.container.setTitle(doctypeLabel);
        } else if (this.doc._notInserted) {
            this.container.setTitle(frappe._('New {0}', doctypeLabel));
        } else {
            this.container.setTitle(this.doc.name);
        }
        if (this.doc.submitted) {
            // this.container.addTitleBadge('✓', frappe._('Submitted'));
        }
    }

    async bindEvents(doc) {
        if (this.doc && this.docListener) {
            // stop listening to the old doc
            this.doc.off(this.docListener);
        }
        this.doc = doc;
        for (let control of this.controlList) {
            control.bind(this.doc);
        }

        this.setupDocListener();
        this.trigger('use', {doc:doc});
    }

    setupDocListener() {
        // refresh value in control
        this.docListener = (params) => {
            if (params.fieldname) {
                // only single value changed
                let control = this.controls[params.fieldname];
                if (control && control.getInputValue() !== control.format(params.fieldname)) {
                    control.refresh();
                }
            } else {
                // multiple values changed
                this.refresh();
            }
            this.trigger('change');
            this.form.classList.remove('was-validated');
        };

        this.doc.on('change', this.docListener);
        this.trigger('change');
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

    refresh() {
        for(let control of this.controlList) {
            control.refresh();
        }
    }

    async submit() {
        this.doc.submitted = 1;
        await this.save();
    }

    async revert() {
        this.doc.submitted = 0;
        await this.save();
    }

    async save() {
        if (!this.checkValidity()) {
            this.form.classList.add('was-validated');
            return;
        }
        try {
            let oldName = this.doc.name;
            if (this.doc._notInserted) {
                await this.doc.insert();
            } else {
                await this.doc.update();
            }
            frappe.ui.showAlert({message: frappe._('Saved'), color: 'green'});
            if (oldName !== this.doc.name) {
                frappe.router.setRoute('edit', this.doctype, this.doc.name);
                return;
            }
            this.refresh();
            this.trigger('change');
        } catch (e) {
            frappe.ui.showAlert({message: frappe._('Failed'), color: 'red'});
            return;
        }
        await this.trigger('save');
    }

    async delete() {
        try {
            await this.doc.delete();
            frappe.ui.showAlert({message: frappe._('Deleted'), color: 'green'});
            this.trigger('delete');
        } catch (e) {
            frappe.ui.showAlert({message: e, color: 'red'});
        }
    }
}