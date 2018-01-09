const frappe = require('frappe-core');

class Document {
	constructor(data) {
		this.handlers = {};
		this.setup();
		Object.assign(this, data);
	}

	setup() {
		// add handlers
	}

	clear_handlers() {
		this.handlers = {};
	}

	add_handler(key, method) {
		if (!this.handlers[key]) {
			this.handlers[key] = [];
		}
		this.handlers[key].push(method || key);
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

	async load() {
		Object.assign(this, await frappe.db.get(this.doctype, this.name));
	}

	async insert() {
		this.set_name();
		this.set_standard_values();
		await this.trigger('validate', 'before_insert');
		await frappe.db.insert(this.doctype, this.get_valid_dict());
		await this.trigger('after_insert', 'after_save');
	}

	async delete() {
		await this.trigger('before_delete');
		await frappe.db.delete(this.doctype, this.name);
		await this.trigger('after_delete');
	}

	async trigger() {
		for(var key of arguments) {
			if (this.handlers[key]) {
				for (let method of this.handlers[key]) {
					if (typeof method === 'string') {
						await this[method]();
					} else {
						await method(this);
					}
				}
			}
		}
	}

	async update() {
		this.set_standard_values();
		await this.trigger('validate', 'before_update');
		await frappe.db.update(this.doctype, this.get_valid_dict());
		await this.trigger('after_update', 'after_save');
		return this;
	}
};

module.exports = { Document: Document };