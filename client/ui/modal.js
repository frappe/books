const $ = require('jquery');
const bootstrap = require('bootstrap');

module.exports = class Modal {
    constructor({ title, body, primary_label, primary_action, secondary_label, secondary_action }) {
        Object.assign(this, arguments[0]);
        this.$modal = $(`<div class="modal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>`).appendTo(document.body);

        if (this.primary_label) {
            this.add_primary(this.primary_label, this.primary_action);
        }
        if (this.secondary_label) {
            this.add_secondary(this.secondary_label, this.secondary_action);
        }
        this.show();
    }

    add_primary(label, action) {
        this.$primary = $(`<button type="button" class="btn btn-primary">
            ${label}</button>`)
            .appendTo(this.$modal.find('.modal-footer'))
            .on('click', () => action(this));
    }

    add_secondary(label, action) {
        this.$primary = $(`<button type="button" class="btn btn-secondary">
            ${label}</button>`)
            .appendTo(this.$modal.find('.modal-footer'))
            .on('click', () => action(this));
    }

    show() {
        this.$modal.modal('show');
    }

    hide() {
        this.$modal.modal('hide');
    }

    get_body() {
        return this.$modal.find('.modal-body').get(0);
    }
}