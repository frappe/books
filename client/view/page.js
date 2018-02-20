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

        if(this.title) {
            this.setTitle(this.title);
        }
    }

    make() {
        this.wrapper = frappe.ui.add('div', 'page hide', this.parent);
        this.wrapper.innerHTML = `<div class="page-head clearfix hide">
                <span class="page-title"></span>
            </div>
            <div class="page-body"></div>`
        this.head = this.wrapper.querySelector('.page-head');
        this.body = this.wrapper.querySelector('.page-body');
        this.titleElement = this.head.querySelector('.page-title');
    }

    setTitle(title) {
        this.titleElement.textContent = title;
        if (this.hasRoute) {
            document.title = title;
        }
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