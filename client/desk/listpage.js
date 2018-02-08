const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');

module.exports = class FormPage extends Page {
	constructor(doctype) {
		let meta = frappe.getMeta(doctype);
		super(`List ${meta.name}`);
		this.list = new (view.get_list_class(doctype))({
			doctype: doctype,
			parent: this.body
		});
		this.on('show', async () => {
			await this.list.run();
		});
	}
}
