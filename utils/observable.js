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
        if (this._throttled(event, params, throttle)) return;

        // listify if throttled
        if (throttle) params = [params];

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
        if (throttle) {
            if (this._isHot[event]) {

                // hot, add to queue
                if (this._eventQueue[event]) {

                    // queue exists, just add
                    this._eventQueue[event].push(params);
                } else {

                    // create a new queue to be called after cool-off
                    this._eventQueue[event] = [params];

                    // call after cool-off
                    setTimeout(() => {
                        let _queuedParams = this._eventQueue[event];

                        // reset queues
                        this._isHot[event] = false;
                        this._eventQueue[event] = null;

                        this.trigger(event, _queuedParams, true);
                    }, throttle);

                }
                return true;
            }
            this._isHot[event] = true;
        }
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
