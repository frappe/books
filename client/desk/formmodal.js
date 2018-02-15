const Modal = require('frappejs/client/ui/modal');
const view = require('frappejs/client/view');

module.exports = class FormModal extends Modal {
    constructor(doctype, name) {
        super({title: doctype});
        this.doctype = doctype;
    }

    async showWith(doctype, name) {
        this.show();
        await this.setDoc(doctype, name);
    }

    async setDoc(doctype, name) {
        if (!this.form) {
            this.makeForm();
        }
        await this.form.setDoc(doctype, name);
        this.modal.querySelector('input').focus();
    }

    makeForm() {
		this.form = new (view.getFormClass(this.doctype))({
			doctype: this.doctype,
			parent: this.getBody(),
            container: this,
            actions: ['submit']
        });

        this.form.on('submit', async () => {
            await this.trigger('submit');
            this.hide();
        });
    }

    addButton(label, className, action) {
        if (className === 'primary') {
            this.addPrimary(label, action);
        } else {
            this.addSecondary(label, action);
        }
    }

}