# Observable Base Class

The `Observable` base class makes and subclass trigger events and accept event listeners.

### Example

```js
class Test extends Observable {
    doSomething() {
        // work
        this.trigger('work-done', {some: params})
    }
}

let test = new Test();
test.on('work-done', (params) => yay());
```

### With Sockets

You can also bind sockets (SocketIO) to an `Observable` and all events will also be emitted or received via the socket. See the API below for binding sockets.

### Methods

- `on(event, listener)`: Listen to an event
- `trigger(event)`: trigger an event
- `once(event, listener)`: trigger an event once
- `bindSocketServer(socket)`: Emit triggers on this socket
- `bindSocketClient(socket)`: Listen for events on this socket