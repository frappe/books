const frappe = require('frappe-core');

class Document {
	constructor(data) {
		Object.assign(this, data);
	}

	get(key) {
		return this[key];
	}

	set(key, value) {
		this.validate_field(key, value);
		this[key] = value;
	}

	set_name() {
		// assign a random name by default
		// override this to set a name
		if (!this.name) {
			this.name = Math.random().toString(36).substr(3);
		}
	}

	get meta() {
		if (!this._meta) {
			this._meta = frappe.get_meta(this.doctype);
		}
		return this._meta;
	}

	append(key, document) {
		if (!this[key]) {
			this[key] = [];
		}
		this[key].push(this.init_doc(document));
	}

	init_doc(data) {
		if (data.prototype instanceof Document) {
			return data;
		} else {
			return new Document(d);
		}
	}

	validate_field (key, value) {
		let df = this.meta.get_field(key);
		if (df.fieldtype=='Select') {
			this.meta.validate_select(df, value);
		}
	}

	validate() { }
	before_insert() { }
	after_insert() { }
	before_update() { }
	after_update() { }
	after_save() { }

	get_valid_dict() {
		let doc = {};
		for(let df of this.meta.get_valid_fields()) {
			doc[df.fieldname] = this.get(df.fieldname);
		}
		return doc;
	}

	set_standard_values() {
		let now = new Date();
		if (this.docstatus === null || this.docstatus === undefined) {
			this.docstatus = 0;
		}
		if (!this.owner) {
			this.owner = frappe.session.user;
			this.creation = now;
		}
		this.modified_by = frappe.session.user;
		this.modified = now;
	}

	load() {
		Object.assign(this, frappe.db.get(this.doctype, this.name));
		return this;
	}

	insert() {
		this.set_name();
		this.set_standard_values();
		this.validate();
		this.before_insert();
		frappe.db.insert(this.doctype, this.get_valid_dict())
		this.after_insert();
		this.after_save();
		return this;
	}

	update() {
		this.set_standard_values();
		this.validate();
		this.before_insert();
		frappe.db.update(this.doctype, this.get_valid_dict());
		this.after_update();
		this.after_save();
		return this;
	}
};

module.exports = { Document: Document };