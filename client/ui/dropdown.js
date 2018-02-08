const frappe = require('frappejs');

class Dropdown {
    constructor({parent, label, btn_class = 'btn-secondary', items = []}) {
        Object.assign(this, arguments[0]);

        this.dropdown_items = [];
        this.setup_background_click();
        this.make();

        // init items
        if (this.items) {
            for (item of this.items) {
                this.add_item(item.label, item.action);
            }
        }
    }

    setup_background_click() {
        if (!document.dropdown_setup) {
            frappe.dropdowns = [];
            // setup hiding all dropdowns on click
            document.addEventListener('click', (event) => {
                for (let d of frappe.dropdowns) {
                    if (d.button !== event.target) {
                        d.collapse();
                    }
                }
            });
            document.dropdown_setup = true;
        }
        frappe.dropdowns.push(this);
    }

    make() {
        this.dropdown = frappe.ui.add('div', 'dropdown', this.parent);
        this.make_button();
        this.dropdown_menu = frappe.ui.add('div', 'dropdown-menu', this.dropdown);
    }

    make_button() {
        this.button = frappe.ui.add('button', 'btn ' + this.btn_class,
            this.dropdown);
        frappe.ui.add_class(this.button, 'dropdown-toggle');
        this.button.textContent = this.label;
        this.button.addEventListener('click', () => {
            this.toggle();
        });
    }

    expand() {
        this.dropdown.classList.add('show');
        this.dropdown_menu.classList.add('show');
    }

    collapse() {
        this.dropdown.classList.remove('show');
        this.dropdown_menu.classList.remove('show');
    }

    toggle() {
        this.dropdown.classList.toggle('show');
        this.dropdown_menu.classList.toggle('show');
    }

    add_item(label, action) {
        let item = frappe.ui.add('button', 'dropdown-item', this.dropdown_menu);
        item.textContent = label;
        item.setAttribute('type', 'button');
        if (typeof action === 'string') {
            item.src = action;
            item.addEventListener('click', async () => {
                await frappe.router.setRoute(action);
                this.toggle();
            });
        } else {
            item.addEventListener('click', async () => {
                await action();
                this.toggle();
            });
        }
        this.dropdown_items.push(item);
    }

    float_right() {
        frappe.ui.add_class(this.dropdown, 'float-right');
        frappe.ui.add_class(this.dropdown_menu, 'dropdown-menu-right');
    }
}

module.exports = Dropdown;