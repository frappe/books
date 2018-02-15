const Modal = require('frappejs/client/ui/modal');
const view = require('frappejs/client/view');
const frappe = require('frappejs');

module.exports = class FormModal extends Modal {
    constructor(doctype, name) {
        super({title: doctype});
        this.doctype = doctype;
        this.makeForm();
        this.showWith(doctype, name);
    }

    makeForm() {
		this.form = new (view.getFormClass(this.doctype))({
			doctype: this.doctype,
			parent: this.getBody(),
            container: this,
            actions: ['submit']
        });

        this.form.on('submit', () => {
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

    async showWith(doctype, name) {
        await this.form.setDoc(doctype, name);
        this.show();
        this.$modal.find('input:first').focus();
    }
}