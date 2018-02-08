const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');
const frappejs = require('frappejs');

module.exports = class FormPage extends Page {
	constructor(doctype) {
		let meta = frappe.getMeta(doctype)
		super(`Edit ${meta.name}`);
		this.meta = meta;

		this.form = new (view.get_form_class(doctype))({
			doctype: doctype,
			parent: this.body
		});

		this.on('show', async (params) => {
			await this.show_doc(params.doctype, params.name);
		});

		// if name is different after saving, change the route
		this.form.on('submit', async (params) => {
			let route = frappe.router.get_route();
			if (this.form.doc.name && !(route && route[2] === this.form.doc.name)) {
				await frappe.router.set_route('edit', this.form.doc.doctype, this.form.doc.name);
				this.form.show_alert('Added', 'success');
			}
		});

		this.form.on('delete', async (params) => {
			await frappe.router.set_route('list', this.form.doctype);
		});
	}

	async show_doc(doctype, name) {
		try {
			this.doc = await frappe.get_doc(doctype, name);
			this.form.use(this.doc);
		} catch (e) {
			this.render_error(e.status_code, e.message);
		}
	}
}
