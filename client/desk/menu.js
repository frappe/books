const frappe = require('frappejs');

module.exports = class DeskMenu {
    constructor(parent) {
        this.parent = parent;
        this.routeItems = {};
        this.make();
    }

    make() {
        this.listGroup = frappe.ui.add('div', 'list-body', this.parent);
    }

    addItem(label, action) {
        let item = frappe.ui.add('div', 'list-row', this.listGroup, label);
        if (typeof action === 'string') {
            this.routeItems[action] = item;
        }
        item.addEventListener('click', async () => {
            if (typeof action === 'string') {
                await frappe.router.setRoute(action);
            } else {
                action();
            }
            this.setActive(item);
        });
    }

    setActive() {
        if (this.routeItems[window.location.hash]) {
            let item = this.routeItems[window.location.hash];
            let className = 'active';
            let activeItem = this.listGroup.querySelector('.' + className);

            if (activeItem) {
                activeItem.classList.remove(className);
            }
            item.classList.add(className);
        }
    }
}