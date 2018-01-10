const BaseControl = require('./base');

class SelectControl extends BaseControl {
	make_input() {
		this.input = frappe.ui.add('select', 'form-control', this.form_group);

		let options = this.options;
		if (typeof options==='string') {
			options = options.split('\n');
		}

		for (let value of options) {
			let option = frappe.ui.add('option', null, this.input);
			option.textContent = value;
			option.setAttribute('value', value);
		}
	}
	make() {
		super.make();
		this.input.setAttribute('row', '3');
	}
};

module.exports = SelectControl;