const $ = require('jquery');
const bootstrap = require('bootstrap');
const Observable = require('frappejs/utils/observable');

module.exports = class Modal extends Observable {
    constructor({ title, body, primary, secondary }) {
        super();
        Object.assign(this, arguments[0]);
        this.make();
        this.show();
    }

    make() {
        this.$modal = $(`<div class="modal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${this.title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${this.getBodyHTML()}
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

        this.$modal.on('hidden.bs.modal', () => this.trigger('hide'));
        this.$modal.on('shown.bs.modal', () => this.trigger('show'));
    }

    getBodyHTML() {
        return this.body || '';
    }

    addPrimary(label, action) {
        return $(`<button type="button" class="btn btn-primary">
            ${label}</button>`)
            .appendTo(this.$modal.find('.modal-footer'))
            .on('click', () => action(this));
    }

    addSecondary(label, action) {
        return $(`<button type="button" class="btn btn-secondary">
            ${label}</button>`)
            .appendTo(this.$modal.find('.modal-footer'))
            .on('click', () => action(this));
    }

    setTitle(title) {
        this.$modal.find('.modal-title').text(title);
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