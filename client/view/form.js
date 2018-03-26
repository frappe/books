const frappe = require('frappejs');
const controls = require('./controls');
const FormLayout = require('./formLayout');
const Observable = require('frappejs/utils/observable');
const keyboard = require('frappejs/client/ui/keyboard');

module.exports = class BaseForm extends Observable {
    constructor({doctype, parent, submit_label='Submit', container, meta, inline=false}) {
        super();
        Object.assign(this, arguments[0]);
        this.links = [];

        this.meta = frappe.getMeta(this.doctype);

        if (this.setup) {
            this.setup();
        }

        this.make();
        this.bindFormEvents();

        if (this.doc) {
            // bootstrapped with a doc
            this.bindEvents(this.doc);
        }
    }

    make() {
        if (this.body || !this.parent) {
            return;
        }

        if (this.inline) {
            this.body = this.parent
        } else {
            this.body = frappe.ui.add('div', 'form-body', this.parent);
        }

        if (this.actions) {
            this.makeToolbar();
        }

        this.form = frappe.ui.add('form', 'form-container', this.body);

        if (this.inline) {
            this.form.classList.add('form-inline');
        }

        this.form.onValidate = true;

        this.formLayout = new FormLayout({
            fields: this.meta.fields,
            layout: this.meta.layout
        });

        this.form.appendChild(this.formLayout.form);

        this.bindKeyboard();
    }

    bindFormEvents() {
        if (this.meta.formEvents) {
            for (let key in this.meta.formEvents) {
                this.on(key, this.meta.formEvents[key]);
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
        if (!this.container) return;

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

    setLinks(label, options) {
        // set links to helpful reports as identified by this.meta.links
        if (this.meta.links) {
            let links = this.getLinks();
            if (!links.equals(this.links)) {
                this.refreshLinks(links);
                this.links = links;
            }
        }
    }

    getLinks() {
        let links = [];
        for (let link of this.meta.links) {
            if (link.condition(this)) {
                links.push(link);
            }
        }
        return links;
    }

    refreshLinks(links) {
        if (!this.container) return;

        this.container.clearLinks();
        for(let link of links) {
            // make the link
            this.container.addLink(link.label, () => {
                let options = link.action(this);

                if (options) {
                    if (options.params) {
                        // set route parameters
                        frappe.params = options.params;
                    }

                    if (options.route) {
                        // go to the given route
                        frappe.router.setRoute(...options.route);
                    }
                }
            });
        }
    }

    async bindEvents(doc) {
        if (this.doc && this.docListener) {
            // stop listening to the old doc
            this.doc.off(this.docListener);
        }
        this.doc = doc;
        for (let control of this.formLayout.controlList) {
            control.bind(this.doc);
        }

        this.refresh();
        this.setupDocListener();
        this.trigger('use', {doc:doc});
    }

    setupDocListener() {
        // refresh value in control
        this.docListener = (params) => {
            if (params.fieldname) {
                // only single value changed
                let control = this.formLayout.controls[params.fieldname];
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
            for (let control of this.formLayout.controlList) {
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
        for(let control of this.formLayout.controlList) {
            control.refresh();
        }
        this.trigger('refresh', this);
        this.setLinks();
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