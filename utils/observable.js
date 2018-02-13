module.exports = class Observable {
    on(event, handler) {
        this._addHandler('_handlers', event, handler);
    }

    once(event, handler) {
        this._addHandler('_onceHandlers', event, handler);
    }

    async trigger(event, params) {
        await this._triggerHandler('_handlers', event, params);
        await this._triggerHandler('_onceHandlers', event, params);
        if (this._onceHandlers && this._onceHandlers[event]) {
            delete this._onceHandlers[event];
        }
    }

    _addHandler(name, event, handler) {
        if (!this[name]) {
            this[name] = {};
        }
        if (!this[name][event]) {
            this[name][event] = [];
        }
        this[name][event].push(handler);
    }

    async _triggerHandler(name, event, params) {
        if (this[name] && this[name][event]) {
            for (let handler of this[name][event]) {
                await handler(params);
            }
        }
    }
}
