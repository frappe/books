module.exports = class Observable {
    constructor() {
        this._isHot = {};
        this._eventQueue = {};
    }

    on(event, listener) {
        this._addListener('_listeners', event, listener);
        if (this._socketClient) {
            this._socketClient.on(event, listener);
        }
    }

    // remove listener
    off(event, listener) {
        for (let type of ['_listeners', '_onceListeners']) {
            let index = this[type] && this[type][event] && this[type][event].indexOf(listener);
            if (index) {
                this[type][event].splice(index, 1);
            }
        }
    }

    once(event, listener) {
        this._addListener('_onceListeners', event, listener);
    }

    bindSocketClient(socket) {
        // also send events with sockets
        this._socketClient = socket;
    }

    bindSocketServer(socket) {
        // also send events with sockets
        this._socketServer = socket;
    }

    async trigger(event, params, throttle=false) {
        if (throttle) {
            if (this._throttled(event, params, throttle)) return;
            params = [params]
        }

        await this._executeTriggers(event, params);
    }

    async _executeTriggers(event, params) {
        await this._triggerEvent('_listeners', event, params);
        await this._triggerEvent('_onceListeners', event, params);

        if (this._socketServer) {
            this._socketServer.emit(event, params);
        }

        // clear once-listeners
        if (this._onceListeners && this._onceListeners[event]) {
            delete this._onceListeners[event];
        }
    }

    _throttled(event, params, throttle) {
        if (this._isHot[event]) {
            // hot, add to queue
            if (!this._eventQueue[event]) this._eventQueue[event] = [];
            this._eventQueue[event].push(params);

            // aleady hot, quit
            return true;
        }
        this._isHot[event] = true;

        // cool-off
        setTimeout(() => {
            this._isHot[event] = false;

            // flush queue
            if (this._eventQueue[event]) {
                let _queuedParams = this._eventQueue[event];
                this._eventQueue[event] = null;
                this._executeTriggers(event, _queuedParams);
            }
        }, throttle);

        return false;
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
