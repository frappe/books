const frappe = require('frappejs');

module.exports = class DeskMenu {
    constructor(parent) {
        this.parent = parent;
        this.routeItems = {};
        this.make();
    }

    make() {
        this.listGroup = frappe.ui.add('div', 'list-group list-group-flush', this.parent);
    }

    addItem(label, action) {
        let item = frappe.ui.add('a', 'list-group-item list-group-item-action', this.listGroup);
        item.textContent = label;
        if (typeof action === 'string') {
            item.href = action;
            this.routeItems[action] = item;
        } else {
            item.addEventListener('click', () => {
                action();
                this.setActive(item);
            });
        }
    }

    setActive() {
        if (this.routeItems[window.location.hash]) {
            let item = this.routeItems[window.location.hash];
            let className = 'list-group-item-secondary';
            let activeItem = this.listGroup.querySelector('.' + className);

            if (activeItem) {
                activeItem.classList.remove(className);
            }
            item.classList.add(className);
        }
    }
}