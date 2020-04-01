import {Server as HTTPServer, IncomingMessage} from 'http';
import {Server as HTTPSServer} from 'https';
import WebSocket from 'ws';
import {ProceduresBase, ChannelsBase} from '../shared/communications';
import {PatchedExtensionCodec, defaultExtensionCodec, createEncoder, createDecoder} from '../shared/msgpack';
import {Middleware} from './middlewares';
import {Procedures} from './procedures';
import {Channels} from './channels';
import {middlewares, procedures, channels} from './symbols';
import {Store, createStore} from './helpers';
import {makeNewContextListener} from './context';

export type ApiServerOptions = Omit<WebSocket.ServerOptions, 'server'> & {
    server?: WebSocket.Server | HTTPServer | HTTPSServer;
    extensionCodec?: PatchedExtensionCodec;
};

export type ApiServer<
    P extends ProceduresBase,
    C extends ChannelsBase
> = {
    [middlewares]: Store<Middleware[]>;
    [procedures]: Store<Partial<Procedures<P>>>;
    [channels]: Store<Partial<Channels<C>>>;
    handle(event: 'error', cb: (err: Error) => void): () => void;
    handle(event: 'close' | 'listening', cb: () => void): () => void;
    handle(event: 'headers', cb: (headers: string[], request: IncomingMessage) => void): () => void;
    close(): Promise<void>;
};

export function createServer<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(options: ApiServerOptions = {}) {
    const wss = extractWSServer(options);
    const extensionCodec = extractExtensionCodec(options);
    const encode = createEncoder(extensionCodec);
    const decode = createDecoder(extensionCodec);
    const apiServer: ApiServer<ProceduresInfo, ChannelsInfo> = {
        [middlewares]: createStore<Middleware[]>([]),
        [procedures]: createStore<Partial<Procedures<ProceduresInfo>>>({}),
        [channels]: createStore<Partial<Channels<ChannelsInfo>>>({}),
        handle: makeHandle(wss),
        close: wrapClose(wss)
    };
    return runServer(wss, apiServer, encode, decode);
}

function runServer<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(
    wss: WebSocket.Server,
    apiServer: ApiServer<ProceduresInfo, ChannelsInfo>,
    encode: (value: unknown) => Uint8Array,
    decode: (data: Uint8Array | ArrayBuffer) => unknown
) {
    const newContextListener = makeNewContextListener(apiServer, encode, decode);
    return (wss
        .on('connection', newContextListener)
        .once('close', () => wss.off('connection', newContextListener))
    ), apiServer;
}

function extractWSServer(options: ApiServerOptions): WebSocket.Server {
    return (options.server instanceof WebSocket.Server
        ? options.server
        : new WebSocket.Server(options)
    );
}

function extractExtensionCodec(options: ApiServerOptions): PatchedExtensionCodec {
    return (options.extensionCodec instanceof PatchedExtensionCodec
        ? options.extensionCodec
        : defaultExtensionCodec
    );
}

function wrapClose(wss: WebSocket.Server) {
    return (): Promise<void> => new Promise(
        (resolve, reject) => wss.close(
            err => (err ? reject(err) : resolve())
        )
    );
}

function makeHandle(wss: WebSocket.Server) {
    type Events = {
        error: (err: Error) => void;
        close: () => void;
        listening: () => void;
        headers: (headers: string[], request: IncomingMessage) => void;
    };
    return <E extends keyof Events>(event: E, cb: Events[E]) => (
        wss.on(event, cb),
        () => wss.off(event, cb)
    );
}