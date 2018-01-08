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

	async render() {
		this.make_body();
		let data = await this.meta.get_list(this.start, this.page_length);

		for (let i=0; i< data.length; i++) {
			this.render_row(this.start + i, data[i]);
		}
	}

	make_body() {
		if (!this.body) {
			this.body = $('<div class="list-body"></div>')
				.appendTo(frappe.main);
		}
	}

	render_row(i, data) {
		let row = this.get_row(i);
		row.html(this.meta.get_row_html(data));
	}

	get_row(i) {
		if (!this.rows[i]) {
			this.rows[i] = $('<div class="list-row"></div>').appendTo(this.body);
		}
		return this.rows[i];
	}

};

module.exports = {
	ListView: ListView
};