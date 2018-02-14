const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');
const Dropdown = require('frappejs/client/ui/dropdown');

module.exports = class Page extends Observable {
    constructor({title, parent, hasRoute=true}) {
        super();
        Object.assign(this, arguments[0]);
        if (!this.parent) {
            this.parent = frappe.desk.body;
        }
        this.make();
        this.dropdowns = {};
    }

    make() {
        this.wrapper = frappe.ui.add('div', 'page hide', this.parent);
        this.wrapper.innerHTML = `<div class="page-head hide"></div>
            <div class="page-body"></div>`
        this.head = this.wrapper.querySelector('.page-head');
        this.body = this.wrapper.querySelector('.page-body');
    }

    hide() {
        this.wrapper.classList.add('hide');
        this.trigger('hide');
    }

    addButton(label, className, action) {
        this.head.classList.remove('hide');
        this.button = frappe.ui.add('button', 'btn ' + this.getClassName(className), this.head);
        this.button.innerHTML = label;
        this.button.addEventListener('click', action);
        return this.button;
    }

    getDropdown(label) {
        if (!this.dropdowns[label]) {
            this.dropdowns[label] = new Dropdown({parent: this.head, label: label, right: true});
        }
        return this.dropdowns[label];
    }

    async show(params) {
        if (this.parent.activePage) {
            this.parent.activePage.hide();
        }

        this.wrapper.classList.remove('hide');
        this.body.classList.remove('hide');

        if (this.page_error) {
            this.page_error.classList.add('hide');
        }

        this.parent.activePage = this;

        if (this.hasRoute) {
            document.title = this.title;
        }

        await this.trigger('show', params);
    }

    renderError(title, message) {
        if (!this.page_error) {
            this.page_error = frappe.ui.add('div', 'page-error', this.wrapper);
        }
        this.body.classList.add('hide');
        this.page_error.classList.remove('hide');
        this.page_error.innerHTML = `<h3 class="text-extra-muted">${title ? title : ""}</h3><p class="text-muted">${message ? message : ""}</p>`;
    }

    getClassName(className) {
        const newName = {
            'primary': 'btn-primary',
            'secondary': 'btn-outline-secondary'
        }[className];

        return newName || className;
    }
}