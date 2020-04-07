import {Handle, Emit, createHandle} from './handle';
import {CloseFn, closeFromSocket} from './close';
import {
    EVENT_SEND,
    EVENT_OPEN,
    EVENT_CLOSE,
    EVENT_ERROR,
    EVENT_MESSAGE
} from './events';

type Fn<Args extends any[] = []> = (...args: Args) => void;

export type InEvents = {
    [EVENT_SEND]: (data: ArrayBufferView) => void;
    [EVENT_CLOSE]: CloseFn;
};
export type OutEvents = {
    [EVENT_OPEN]: Fn;
    [EVENT_CLOSE]: CloseFn;
    [EVENT_ERROR]: Fn;
    [EVENT_MESSAGE]: (data: Uint8Array) => void;
};

type NativeEvents = {
    [EVENT_OPEN]: Event;
    [EVENT_CLOSE]: CloseEvent;
    [EVENT_ERROR]: Event;
    [EVENT_MESSAGE]: MessageEvent;
};
type NativeEventCallback<E extends keyof NativeEvents> = (event: NativeEvents[E]) => void;

export function createConnection(url: string): [Handle<OutEvents>, Emit<InEvents>] {
    const [inHandle, inEmit] = createHandle<InEvents>();
    const [outHandle, outEmit] = createHandle<OutEvents>();
    return connect(url, inHandle, outEmit), [outHandle, inEmit];
}

function connect(url: string, inHandle: Handle<InEvents>, outEmit: Emit<OutEvents>) {
    const socket = new WebSocket(url);
    // eslint-disable-next-line fp/no-mutation
    socket.binaryType = 'arraybuffer';
    const unhandleSend = inHandle(EVENT_SEND, data => socket.send(data.buffer));
    const unhandleClose = inHandle(EVENT_CLOSE, closeFromSocket(socket));
    const reconnect = () => (unhandleSend(), unhandleClose(), connect(url, inHandle, outEmit));
    const silentClose = subscribeClose(socket, outEmit, reconnect);
    return (
        subscribeOpen(socket, outEmit),
        subscribeError(socket, outEmit, silentClose),
        subscribeMessage(socket, outEmit)
    );
}

function subscribeOpen(socket: WebSocket, outEmit: Emit<OutEvents>) {
    return subscribeEvent(socket, EVENT_OPEN, () => outEmit(EVENT_OPEN), true);
}
function subscribeClose(socket: WebSocket, outEmit: Emit<OutEvents>, reconnect: Fn) {
    const unsubscribeClose = subscribeEvent(socket, EVENT_CLOSE, e => (e.wasClean
        ? outEmit(EVENT_CLOSE, e.code, e.reason)
        : reconnect()
    ));
    return (needReconnect = false) => (
        unsubscribeClose(),
        socket.close(),
        (needReconnect && reconnect())
    );
}
function subscribeError(socket: WebSocket, outEmit: Emit<OutEvents>, reconnect: Fn<[boolean]>) {
    return subscribeEvent(socket, EVENT_ERROR, () => (
        outEmit(EVENT_ERROR),
        reconnect(true)
    ));
}
function subscribeMessage(socket: WebSocket, outEmit: Emit<OutEvents>) {
    return subscribeEvent(socket, EVENT_MESSAGE, e => outEmit(EVENT_MESSAGE, new Uint8Array(e.data)));
}

function subscribeEvent<E extends keyof NativeEvents>(socket: WebSocket, event: E, callback: NativeEventCallback<E>, once: true): void;
function subscribeEvent<E extends keyof NativeEvents>(socket: WebSocket, event: E, callback: NativeEventCallback<E>): Fn;
function subscribeEvent<E extends keyof NativeEvents>(socket: WebSocket, event: E, callback: NativeEventCallback<E>, once = false) {
    const add = (cb: NativeEventCallback<E>) => socket.addEventListener(event, cb);
    const remove = (cb: NativeEventCallback<E>) => socket.removeEventListener(event, cb);
    const cbWithRemove = (e: NativeEvents[E]) => (remove(cbWithRemove), callback(e));
    return (once
        ? add(cbWithRemove)
        : (
            add(callback),
            () => remove(callback)
        )
    );
}