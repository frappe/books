const frappe = require('frappe-core');

class todo extends frappe.document.Document {
	setup() {
		this.add_handler('validate');
	}
	validate() {
		if (!this.status) {
			this.status = 'Open';
		}
	}
}

module.exports = { todo: todo };
