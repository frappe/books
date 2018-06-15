const BaseForm = require('frappejs/client/view/Form');
const frappe = require('frappejs');

module.exports = class EmailForm extends BaseForm {
    constructor({ doctype, parent, submit_label='', container, meta, inline=false }) {
        super({ doctype: 'Email', parent: parent, container: container, meta: meta });
        this.makeToolbar();
    }

    makeToolbar() {
        this.sendButton = this.container.addButton(frappe._("Send"), 'primary', async (event) => {
           frappe.call({
               method: 'send-mail',
               args: this.doc.getValidDict()
           });
        });
        this.on('change', () => {
            const show = this.doc._dirty && !this.doc.submitted;
            this.sendButton.classList.toggle('hide', !show);
        });
    }
};
