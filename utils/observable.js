module.exports = class Observable {
    on(event, listener) {
        this._addListener('_listeners', event, listener);
        if (this._socketClient) {
            this._socketClient.on(event, listener);
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

    async trigger(event, params) {
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
