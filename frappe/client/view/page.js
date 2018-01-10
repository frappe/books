const frappe = require('frappe-core');

class Page {
	constructor(title) {
		this.handlers = {};
		this.title = title;
		this.make();
	}

	make() {
		this.body = frappe.ui.add('div', 'page hide', frappe.main);
	}

	hide() {
		frappe.ui.add_class(this.body, 'hide');

		this.trigger('hide');
	}

	show(params) {
		if (frappe.router.current_page) {
			frappe.router.current_page.hide();
		}
		frappe.ui.remove_class(this.body, 'hide');
		frappe.router.current_page = this;
		document.title = this.title;

		this.trigger('show', params);
	}

	on(event, fn) {
		if (!this.handlers[event]) this.handlers.event = [];
		this.handlers[event].push(fn);
	}

	trigger(event, params) {
		if (this.handlers[event]) {
			for (let handler of this.handlers[event]) {
				handler(params);
			}
		}
	}
}

module.exports = { Page: Page };