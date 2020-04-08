import {IncomingMessage} from 'http';
import {EventEmitter} from 'events';
import WebSocket from 'ws';
import {
    ProceduresBase,
    ChannelsBase,
    Communication,
    createCommunication,
    isPackedCommunication,
    unpackCommunication,
    MESSAGE
} from '../shared/communications';
import {Encoder, Decoder} from '../shared/msgpack-extensions';
import {ApiServer} from './apiServer';
import {createPinger} from './ping';
import {createContextRunner} from './contextRunner';
import {Store, createStore} from './helpers';
import {send, communication} from './symbols';

export type ApiServerContext = {
    [send]: (data: Communication) => void;
    socket: WebSocket;
    request: IncomingMessage;
    session: Store<Record<string | symbol, any>>;
    handle(event: 'error', cb: (err: Error) => void): () => void;
    handle(event: 'message', cb: (payload: unknown) => void): () => void;
    handle(event: 'close', cb: (code: number, reason: string) => void): () => void;
    ping: ReturnType<typeof createPinger>;
    send(payload: unknown): void;
    close(code?: number, reason?: string): void;
};

export function makeNewContextListener<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(
    apiServer: ApiServer<ProceduresInfo, ChannelsInfo>,
    encode: Encoder,
    decode: Decoder
) {
    return (socket: WebSocket, request: IncomingMessage) => {
        // eslint-disable-next-line fp/no-mutation
        socket.binaryType = 'arraybuffer';
        const emitter = new EventEmitter();
        const sender = createSender(socket, encode);
        const ctx = createContext(socket, request, sender, emitter);
        return (connectSocket(apiServer, socket, decode, emitter)
            .once('open', createContextRunner(ctx, emitter, apiServer))
        );
    };
}

function createContext(
    socket: WebSocket,
    request: IncomingMessage,
    sender: (data: Communication) => void,
    emitter: EventEmitter
): ApiServerContext {
    return {
        socket, request, [send]: sender,
        session: createStore({}),
        handle: makeHandle(emitter),
        ping: createPinger(sender),
        send: (payload: unknown) => sender(createCommunication(MESSAGE, payload)),
        close: (code, reason) => socket.close(code, reason)
    };
}

function createSender(socket: WebSocket, encode: (value: unknown) => Uint8Array) {
    return (data: Communication) => socket.send(encode(data));
}

function makeHandle(emitter: EventEmitter) {
    type Events = {
        message: (payload: unknown) => void;
        close: (code: number, reason: string) => void;
    };
    return <E extends keyof Events>(event: E, cb: Events[E]) => (
        emitter.on(event, cb),
        () => emitter.off(event, cb)
    );
}

function connectSocket<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(
    apiServer: ApiServer<ProceduresInfo, ChannelsInfo>,
    socket: WebSocket,
    decode: Decoder,
    emitter: EventEmitter
): WebSocket {
    const messageListener = createMessageListener(decode, emitter);
    const close = emitOnce(emitter, 'close');
    return (
        socket.on('message', messageListener),
        emitter.once('close', () => socket.off('message', messageListener)),
        emitter.once('close', apiServer.handle('close', () => close(1000, 'Server closed'))),
        socket.once('close', close)
    );
}

function createMessageListener(decode: Decoder, emitter: EventEmitter) {
    const wrap = (cb: (data: unknown) => void) => (buffer: Buffer) => cb(decode(buffer));
    return wrap((data: unknown) => isPackedCommunication(data) && emitter.emit(communication, unpackCommunication(data)));
}

function emitOnce(emitter: EventEmitter, event: string) {
    // eslint-disable-next-line immutable/no-let
    let emitted = false;
    return (...args: unknown[]) => {
        if(emitted) { return void 0; }
        // eslint-disable-next-line fp/no-mutation
        emitted = true;
        return emitter.emit(event, ...args);
    };
}