const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');
const Dropdown = require('frappejs/client/ui/dropdown');

module.exports = class Page extends Observable {
    constructor({title, parent, hasRoute=true} = {}) {
        super();
        Object.assign(this, arguments[0]);
        if (!this.parent) {
            this.parent = frappe.desk.body;
        }
        this.make();
        this.dropdowns = {};

        if(this.title) {
            this.setTitle(this.title);
        }
    }

    make() {
        this.wrapper = frappe.ui.add('div', 'page hide', this.parent);
        this.head = frappe.ui.add('div', 'page-nav clearfix hide', this.wrapper);
        this.titleElement = frappe.ui.add('h3', 'page-title', this.wrapper);
        this.linksElement = frappe.ui.add('div', 'btn-group page-links hide', this.wrapper);
        this.body = frappe.ui.add('div', 'page-body', this.wrapper);
    }

    setTitle(title) {
        this.titleElement.textContent = title;
        if (this.hasRoute) {
            document.title = title;
        }
    }

    addTitleBadge(message, title='', style='secondary') {
        this.titleElement.innerHTML += ` <span class='badge badge-${style}' title='${title}'>
            ${message}</span>`;
    }

    addLink(label, action, unhide = true) {
        const link = frappe.ui.add('button', 'btn btn-sm btn-outline-secondary', this.linksElement, label);
        link.addEventListener('click', action);
        if (unhide) {
            this.linksElement.classList.remove('hide');
        }
        return link;
    }

    clearLinks() {
        frappe.ui.empty(this.linksElement);
    }

    hide() {
        this.parent.activePage = null;
        this.wrapper.classList.add('hide');
        this.trigger('hide');
    }

    addButton(label, className, action) {
        this.head.classList.remove('hide');
        this.button = frappe.ui.add('button', 'btn btn-sm float-right ' + this.getClassName(className), this.head);
        this.button.innerHTML = label;
        this.button.addEventListener('click', action);
        return this.button;
    }

    getDropdown(label) {
        if (!this.dropdowns[label]) {
            this.dropdowns[label] = new Dropdown({parent: this.head, label: label,
                right: true, cssClass: 'btn-secondary btn-sm'});
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

        frappe.desk.toggleCenter(this.fullPage ? false : true);
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