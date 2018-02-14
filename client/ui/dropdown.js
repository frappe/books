const frappe = require('frappejs');
const bootstrap = require('bootstrap');
const $ = require('jquery');

class Dropdown {
    constructor({parent, label, items = [], right}) {
        Object.assign(this, arguments[0]);
        Dropdown.instances += 1;
        this.id = 'dropdownMenuButton-' + Dropdown.instances;

        this.make();

        // init items
        if (this.items) {
            for (let item of this.items) {
                this.addItem(item.label, item.action);
            }
        }
    }

    make() {
        this.$dropdown = $(`<div class="dropdown ${this.right ? 'float-right' : ''}">
            <button class="btn btn-outline-secondary dropdown-toggle"
                type="button" id="${this.id}" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">${this.label}
            </button>
            <div class="dropdown-menu ${this.right ? 'dropdown-menu-right' : ''}" aria-labelledby="${this.id}"></div>
        </div>`).appendTo(this.parent)
        this.dropdown = this.$dropdown.get(0);
        this.dropdownMenu = this.dropdown.querySelector('.dropdown-menu');
    }

    addItem(label, action) {
        let item = frappe.ui.add('button', 'dropdown-item', this.dropdownMenu);
        item.textContent = label;
        item.setAttribute('type', 'button');
        if (typeof action === 'string') {
            item.addEventListener('click', async () => {
                await frappe.router.setRoute(action);
            });
        } else {
            item.addEventListener('click', async () => {
                await action();
            });
        }
    }

    floatRight() {
        frappe.ui.addClass(this.dropdown, 'float-right');
    }
}

Dropdown.instances = 0;

module.exports = Dropdown;