const frappe = require('frappe-core');

module.exports = class Page {
    constructor(title) {
        this.handlers = {};
        this.title = title;
        this.make();
    }

    make() {
        this.wrapper = frappe.ui.add('div', 'page hide', frappe.desk.main);
        this.body = frappe.ui.add('div', 'page-body', this.wrapper);
    }

    hide() {
        this.wrapper.classList.add('hide');
        this.trigger('hide');
    }

    show(params) {
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

        this.trigger('show', params);
    }

    render_error(status_code, message) {
        if (!this.page_error) {
            this.page_error = frappe.ui.add('div', 'page-error', this.wrapper);
        }
        this.body.classList.add('hide');
        this.page_error.classList.remove('hide');
        this.page_error.innerHTML = `<h3 class="text-extra-muted">${status_code}</h3><p class="text-muted">${message}</p>`;
    }

    on(event, fn) {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(fn);
    }

    async trigger(event, params) {
        if (this.handlers[event]) {
            for (let handler of this.handlers[event]) {
                await handler(params);
            }
        }
    }
}