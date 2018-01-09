const frappe = require('frappe-core');

class ListView {
	constructor({doctype, parent}) {
		this.doctype = doctype;
		this.parent = parent;
		this.meta = frappe.get_meta(this.doctype);

		this.start = 0;
		this.page_length = 20;

		this.body = null;
		this.rows = [];
	}

	async run() {
		this.make_body();
		let data = await this.meta.get_list({start:this.start, limit:this.page_length});

		for (let i=0; i< data.length; i++) {
			this.render_row(this.start + i, data[i]);
		}
	}

	make_body() {
		if (!this.body) {
			this.body = frappe.ui.add('div', 'list-body', this.parent);
		}
	}

	render_row(i, data) {
		let row = this.get_row(i);
		row.innerHTML = this.meta.get_row_html(data);
	}

	get_row(i) {
		if (!this.rows[i]) {
			this.rows[i] = frappe.ui.add('div', 'list-row', this.body);
		}
		return this.rows[i];
	}

};

module.exports = {
	ListView: ListView
};