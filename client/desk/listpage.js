const frappe = require('frappejs');
const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');

module.exports = class ListPage extends Page {
	constructor(doctype) {
		let meta = frappe.getMeta(doctype);

		// if center column is present, list does not have its route
		const hasRoute = frappe.desk.center ? false : true;

		super({
			title: frappe._("List: {0}", meta.name),
			parent: hasRoute ? frappe.desk.body : frappe.desk.center,
			hasRoute: hasRoute
		});

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
