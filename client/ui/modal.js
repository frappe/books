const $ = require('jquery');
const bootstrap = require('bootstrap');

module.exports = class Modal {
    constructor({ title, body, primary, secondary }) {
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

        if (this.primary) {
            this.addPrimary(this.primary.label, this.primary.action);
        }
        if (this.secondary) {
            this.addSecondary(this.secondary.label, this.secondary.action);
        }
        this.show();
    }

    addPrimary(label, action) {
        this.$primary = $(`<button type="button" class="btn btn-primary">
            ${label}</button>`)
            .appendTo(this.$modal.find('.modal-footer'))
            .on('click', () => action(this));
    }

    addSecondary(label, action) {
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

    getBody() {
        return this.$modal.find('.modal-body').get(0);
    }
}