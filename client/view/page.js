const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');

module.exports = class Page extends Observable {
    constructor(title) {
        super();
        this.title = title;
        this.make();
    }

    make() {
        this.wrapper = frappe.ui.add('div', 'page hide', frappe.desk.body);
        this.wrapper.innerHTML = `<div class="page-head hide"></div>
            <div class="page-body"></div>`
        this.head = this.wrapper.querySelector('.page-head');
        this.body = this.wrapper.querySelector('.page-body');
    }

    hide() {
        this.wrapper.classList.add('hide');
        this.trigger('hide');
    }

    addButton(label, cssClass, action) {
        this.head.classList.remove('hide');
        this.button = frappe.ui.add('button', 'btn ' + cssClass, this.head);
        this.button.innerHTML = label;
        this.button.addEventListener('click', action);
        return this.button;
    }

    async show(params) {
        if (frappe.router.current_page) {
            frappe.router.current_page.hide();
        }
        this.wrapper.classList.remove('hide');
        this.body.classList.remove('hide');

        if (this.page_error) {
            this.page_error.classList.add('hide');
        }

        frappe.router.current_page = this;
        document.title = this.title;

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
}