const Modal = require('frappejs/client/ui/modal');
const view = require('frappejs/client/view');

module.exports = class FormModal extends Modal {
    constructor(doctype, name) {
        super({title: doctype});
        this.doctype = doctype;
    }

    async showWith(doctype, name) {
        if (!name) name = doctype;
        this.show();
        await this.setDoc(doctype, name);
    }

    async setDoc(doctype, name) {
        if (!this.form) {
            this.makeForm();
        }
        await this.form.setDoc(doctype, name);
        let input = this.modal.querySelector('input') || this.modal.querySelector('select');
        input && input.focus();
    }

    makeForm() {
        this.form = new (view.getFormClass(this.doctype))({
            doctype: this.doctype,
            parent: this.getBody(),
            container: this,
            actions: ['save']
        });

        this.form.on('save', async () => {
            await this.trigger('save');
            this.hide();
        });
    }

    addButton(label, className, action) {
        if (className === 'primary') {
            return this.addPrimary(label, action).get(0);
        } else {
            return this.addSecondary(label, action).get(0);
        }
    }

}