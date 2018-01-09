const frappe = require('frappe-core');

module.exports = {
	init({container, main, sidebar}) {
		frappe.container = container;

		if (sidebar) {
			frappe.sidebar = sidebar;
		} else {
			frappe.sidebar = frappe.ui.add('div', 'sidebar', frappe.container);
		}

		if (main) {
			frappe.main = main;
		} else {
			frappe.main = frappe.ui.add('div', 'main', frappe.container);
		}
	},

}