const frappe = require('frappejs');
const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');

module.exports = class ListPage extends Page {
	constructor(doctype) {
		let meta = frappe.getMeta(doctype);
		super(frappe._("List: {0}", meta.name));
		this.list = new (view.getList_class(doctype))({
			doctype: doctype,
			parent: this.body,
			page: this
		});
		this.on('show', async () => {
			await this.list.run();
		});
	}
}
