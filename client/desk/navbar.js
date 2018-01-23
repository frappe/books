const frappe = require('frappejs');

module.exports = class Navbar {
	constructor({brand_label = 'Home'} = {}) {
		Object.assign(this, arguments[0]);
		this.items = {};
		this.navbar = frappe.ui.add('div', 'navbar navbar-expand-md border-bottom', document.querySelector('body'));

		this.brand = frappe.ui.add('a', 'navbar-brand', this.navbar);
		this.brand.href = '#';
		this.brand.textContent = brand_label;

		this.toggler = frappe.ui.add('button', 'navbar-toggler', this.navbar);
		this.toggler.setAttribute('type', 'button');
		this.toggler.setAttribute('data-toggle', 'collapse');
		this.toggler.setAttribute('data-target', 'desk-navbar');
		this.toggler.innerHTML = `<span class="navbar-toggler-icon"></span>`;

		this.navbar_collapse = frappe.ui.add('div', 'collapse navbar-collapse', this.navbar);
		this.navbar_collapse.setAttribute('id', 'desk-navbar');

		this.nav = frappe.ui.add('ul', 'navbar-nav mr-auto', this.navbar_collapse);
	}

	add_item(label, route) {
		let item = frappe.ui.add('li', 'nav-item', this.nav);
		item.link = frappe.ui.add('a', 'nav-link', item);
		item.link.textContent = label;
		item.link.href = route;
		this.items[label] = item;
		return item;
	}

	add_dropdown(label) {

	}

	add_search() {
		let form = frappe.ui.add('form', 'form-inline my-2 my-md-0', this.nav);

	}
}