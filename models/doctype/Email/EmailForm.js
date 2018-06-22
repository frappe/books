const BaseForm = require('frappejs/client/view/form');
const frappe = require('frappejs');

module.exports = class EmailForm extends BaseForm {
    constructor({ doctype, parent, submit_label='', container, meta, inline=false }) {
        super({ doctype: 'Email', parent: parent, container: container, meta: meta });
        this.makeToolbar();
    }

    makeToolbar() {
        this.sendButton = this.container.addButton(frappe._("Send"), 'primary', async (event) => {
           var response = await frappe.call({
               method: 'send-mail',
               args: this.doc.getValidDict()
           });
           await this.doc.set('name',response);
           await this.save();
        });
        this.on('change', () => {
            const show = this.doc._dirty && !this.doc.submitted;
            this.sendButton.classList.toggle('hide', !show);
        });
    }
};
