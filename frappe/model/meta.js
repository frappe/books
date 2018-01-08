const Document = require('./document').Document;
const frappe = require('frappe-core');

class Meta extends Document {
	constructor(data) {
		super(data);
		this.event_handlers = {};
	}

	get_field(fieldname) {
		if (!this.field_map) {
			this.field_map = {};
			for (let df of this.fields) {
				this.field_map[df.fieldname] = df;
			}
		}
		return this.field_map[fieldname];
	}

	on(key, fn) {
		if (!this.event_handlers[key]) {
			this.event_handlers[key] = [];
		}
		this.event_handlers[key].push(fn);
	}

	get_valid_fields() {
		if (!this._valid_fields) {
			this._valid_fields = [];

			// standard fields
			for (let df of frappe.model.standard_fields) {
				this._valid_fields.push(df);
			}

			// parent fields
			if (this.istable) {
				for (let df of frappe.model.child_fields) {
					this._valid_fields.push(df);
				}
			}

			// doctype fields
			for (let df of this.fields) {
				if (frappe.db.type_map[df.fieldtype]) {
					this._valid_fields.push(df);
				}
			}
		}

		return this._valid_fields;
	}

	validate_select(df, value) {
		let options = df.options;
		if (typeof options === 'string') {
			// values given as string
			options = df.options.split('\n');
		}
		if (!options.includes(value)) {
			throw new frappe.ValueError(`${value} must be one of ${options.join(", ")}`);
		}
	}

	trigger(key) {

	}

	// views
	async get_list(start, limit=20) {
		return await frappe.db.get_all({
			doctype: this.name,
			fields: ['name'],
			start: start,
			limit: limit
		});
	}

	get_row_html(data) {
		return `<a href="/view/${this.name}/${data.name}">${data.name}</a>`;
	}

}

module.exports = { Meta: Meta }