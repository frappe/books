const BaseForm = require('frappejs/client/view/Form');
const frappe = require('frappejs');

module.exports = class EmailAccountForm extends BaseForm {
    constructor({ doctype, parent, submit_label='', container, meta, inline=false }) {
        super({ doctype: 'EmailAccount', parent: parent, container: container, meta: meta });
        this.makeSaveButton();
    }

    makeSaveButton() {
        this.saveButton = this.container.addButton(frappe._("Save"), 'primary', async (event) => {
            var response = await frappe.call({
                method: 'validate-mail',
                args: this.doc.getValidDict()
            });
            if(response == true){
                await this.save();
            }
            else{
                frappe.ui.showAlert({message: frappe._('Failed : Invalid Email'), color: 'red'});
            }
        });
        this.on('change', () => {
            const show = this.doc._dirty && !this.doc.submitted;
            this.saveButton.classList.toggle('hide', !show);
        });
    }
};
