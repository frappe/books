module.exports = class Observable {
    constructor() {
        this._observable = {
            isHot: {},
            eventQueue: {},
            listeners: {},
            onceListeners: {}
        }
    }

    // getter, setter stubs, so Observable can be used as a simple Document
    get(key) {
        return this[key];
    }

    set(key, value) {
        this[key] = value;
        this.trigger('change', {
            doc: this,
            fieldname: key
        });
    }

    on(event, listener) {
        this._addListener('listeners', event, listener);
        if (this._observable.socketClient) {
            this._observable.socketClient.on(event, listener);
        }
    }

    // remove listener
    off(event, listener) {
        for (let type of ['listeners', 'onceListeners']) {
            let index = this._observable[type][event] && this._observable[type][event].indexOf(listener);
            if (index) {
                this._observable[type][event].splice(index, 1);
            }
        }
    }

    once(event, listener) {
        this._addListener('onceListeners', event, listener);
    }

    async trigger(event, params, throttle = false) {
        if (throttle) {
            if (this._throttled(event, params, throttle)) return;
            params = [params]
        }

        await this._executeTriggers(event, params);
    }

    async _executeTriggers(event, params) {
        let response = await this._triggerEvent('listeners', event, params);
        if (response === false) return false;

        response = await this._triggerEvent('onceListeners', event, params);
        if (response === false) return false;

        // emit via socket
        if (this._observable.socketServer) {
            this._observable.socketServer.emit(event, params);
        }

        // clear once-listeners
        if (this._observable.onceListeners && this._observable.onceListeners[event]) {
            delete this._observable.onceListeners[event];
        }

    }

    clearListeners() {
        this._observable.listeners = {};
        this._observable.onceListeners = {};
    }

    bindSocketClient(socket) {
        // also send events with sockets
        this._observable.socketClient = socket;
    }

    bindSocketServer(socket) {
        // also send events with sockets
        this._observable.socketServer = socket;
    }

    _throttled(event, params, throttle) {
        if (this._observable.isHot[event]) {
            // hot, add to queue
            if (!this._observable.eventQueue[event]) this._observable.eventQueue[event] = [];
            this._observable.eventQueue[event].push(params);

            // aleady hot, quit
            return true;
        }
        this._observable.isHot[event] = true;

        // cool-off
        setTimeout(() => {
            this._observable.isHot[event] = false;

            // flush queue
            if (this._observable.eventQueue[event]) {
                let _queuedParams = this._observable.eventQueue[event];
                this._observable.eventQueue[event] = null;
                this._executeTriggers(event, _queuedParams);
            }
        }, throttle);

        return false;
    }

    _addListener(type, event, listener) {
        if (!this._observable[type][event]) {
            this._observable[type][event] = [];
        }
        this._observable[type][event].push(listener);
    }

    async _triggerEvent(type, event, params) {
        if (this._observable[type][event]) {
            for (let listener of this._observable[type][event]) {
                await listener(params);
            }
        }
    }
}
