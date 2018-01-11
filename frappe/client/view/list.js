const frappe = require('frappe-core');

class ListView {
	constructor({doctype, parent, fields}) {
		this.doctype = doctype;
		this.parent = parent;
		this.fields = fields;

		this.meta = frappe.get_meta(this.doctype);

		this.start = 0;
		this.page_length = 20;

		this.body = null;
		this.rows = [];
	}

	async run() {
		this.make_body();
		let data = await this.meta.get_list({
			start:this.start,
			limit:this.page_length
		});

		for (let i=0; i< data.length; i++) {
			this.render_row(this.start + i, data[i]);
		}

		this.clear_empty_rows(data.length);
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

	clear_empty_rows(start) {
		if (this.rows.length > start) {
			for (let i=start; i < this.rows.length; i++) {
				let row = this.get_row(i);
				row.innerHTML = '';
			}
		}
	}

};

module.exports = {
	ListView: ListView
};