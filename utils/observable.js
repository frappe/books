module.exports = class Observable {
    on(event, listener) {
        this._addListener('_listeners', event, listener);
    }

    once(event, listener) {
        this._addListener('_onceListeners', event, listener);
    }

    async trigger(event, params) {
        await this._triggerEvent('_listeners', event, params);
        await this._triggerEvent('_onceListeners', event, params);

        // clear once-listeners
        if (this._onceListeners && this._onceListeners[event]) {
            delete this._onceListeners[event];
        }
    }

    _addListener(name, event, listener) {
        if (!this[name]) {
            this[name] = {};
        }
        if (!this[name][event]) {
            this[name][event] = [];
        }
        this[name][event].push(listener);
    }

    async _triggerEvent(name, event, params) {
        if (this[name] && this[name][event]) {
            for (let listener of this[name][event]) {
                await listener(params);
            }
        }
    }

    clearListeners() {
        this._listeners = {};
        this._onceListeners = {};
    }
}
