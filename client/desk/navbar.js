const frappe = require('frappejs');

module.exports = class Navbar {
	constructor({brand_label = 'App'} = {}) {
		Object.assign(this, arguments[0]);
		this.navbar = frappe.ui.add('div', 'navbar', frappe.header);
		this.brand = frappe.ui.add('div', 'navbar-brand', this.navbar);
		this.brand.textContent = this.brand_label || 'App';
	}
}