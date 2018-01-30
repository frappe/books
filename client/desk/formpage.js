const Page = require('frappejs/client/view/page');
const view = require('frappejs/client/view');

module.exports = class FormPage extends Page {
	constructor(doctype) {
		let meta = frappe.get_meta(doctype)
		super(`Edit ${meta.name}`);
		this.meta = meta;

		this.form = new (view.get_form_class(doctype))({
			doctype: doctype,
			parent: this.body
		});

		this.on('show', async (params) => {
			await this.show_doc(params.doctype, params.name);
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
