module.exports = class Observable {
    constructor() {
        this._handlers = {};
    }

    on(event, fn) {
        if (!this._handlers[event]) {
            this._handlers[event] = [];
        }
        this._handlers[event].push(fn);
    }

    async trigger(event, params) {
        if (this._handlers[event]) {
            for (let handler of this._handlers[event]) {
                await handler(params);
            }
        }
    }
}