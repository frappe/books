const frappe = require('frappe-core');

class BaseControl {
	constructor(docfield, parent) {
		Object.assign(this, docfield);
		if (!this.fieldname) {
			this.fieldname = frappe.slug(this.label);
		}
		this.parent = parent;
		if (this.setup) {
			this.setup();
		}
	}

	bind(doc) {
		this.doc = doc;

		this.doc.add_handler(this.fieldname, () => {
			this.set_doc_value();
		});

		this.set_doc_value();
	}

	refresh() {
		this.make();
		this.set_doc_value();
	}

	set_doc_value() {
		if (this.doc) {
			this.set_input_value(this.doc.get(this.fieldname));
		}
	}

	make() {
		if (!this.form_group) {
			this.make_form_group();
			this.make_label();
			this.make_input();
			this.make_description();
			this.bind_change_event();
		}
	}

	make_form_group() {
		this.form_group = frappe.ui.add('div', 'form-group', this.parent);
	}

	make_label() {
		this.label_element = frappe.ui.add('label', null, this.form_group);
		this.label_element.textContent = this.label;
	}

	make_input() {
		this.input = frappe.ui.add('input', 'form-control', this.form_group);
		this.input.setAttribute('type', this.fieldname);
	}

	make_description() {
		if (this.description) {
			this.description_element = frappe.ui.add('small', 'form-text text-muted', this.form_group);
			this.description_element.textContent = this.description;
		}
	}

	set_input_value(value) {
		this.input.value = value;
	}

	async get_input_value() {
		return await this.parse(this.input.value);
	}

	async parse(value) {
		return value;
	}

	bind_change_event() {
		this.input.addEventListener('change', () => this.handle_change(e));
	}

	async handle_change(e) {
		let value = await this.get_input_value();
		value = await this.validate(value);
		await this.doc.set(this.fieldname, value);
	}
}

module.exports = BaseControl;