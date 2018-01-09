const frappe = require('frappe-core');

class Page {
	constructor(title) {
		this.title = title;
		this.make();
	}
	make() {
		this.body = frappe.ui.add('div', 'page hide', frappe.main);
	}
	hide() {
		frappe.ui.add_class(this.body, 'hide');
	}
	show() {
		if (frappe.router.current_page) {
			frappe.router.current_page.hide();
		}
		frappe.ui.remove_class(this.body, 'hide');
		frappe.router.current_page = this;
		document.title = this.title;
	}
}

module.exports = { Page: Page };