import {EventEmitter} from 'events';
import {Server as HTTPServer} from 'http';
import {Server as HTTPSServer} from 'https';
import WebSocket from 'ws';
import {ProceduresBase, ChannelsBase} from '../shared/communications';
import {PatchedExtensionCodec, defaultExtensionCodec} from '../shared/msgpack';
import {Middleware} from './middlewares';
import {Procedures} from './procedures';
import {Channels} from './channels';
import {middlewares, procedures, channels} from './symbols';
import {Store, createStore} from './helpers';
import {makeNewContextListener} from './context';

export type ApiServerOptions<CodecContextType> = Omit<WebSocket.ServerOptions, 'server'> & {
    server?: WebSocket.Server | HTTPServer | HTTPSServer;
    extensionCodec?: PatchedExtensionCodec<CodecContextType>;
};

export type ApiServer<
    P extends Procedures<ProceduresBase>,
    C extends Channels<ChannelsBase>
> = EventEmitter & {
    [middlewares]: Store<Middleware[]>;
    [procedures]: Store<Partial<P>>;
    [channels]: Store<Partial<C>>;
    close(): Promise<void>;
};

export function createServer<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase,
    CodecContextType = undefined
>(options: ApiServerOptions<CodecContextType> = {}) {
    const wsServer = extractWSServer(options);
    const extensionCodec = extractExtensionCodec(options);
    // eslint-disable-next-line fp/no-mutating-assign
    const apiServer = Object.assign(new EventEmitter(), {
        [middlewares]: createStore<Middleware[]>([]),
        [procedures]: createStore<Partial<ProceduresInfo>>({}),
        [channels]: createStore<Partial<ChannelsInfo>>({}),
        close: wrapClose(wsServer)
    }) as ApiServer<Procedures<ProceduresInfo>, Channels<ChannelsInfo>>;
    proxyWSServerEvents(wsServer, apiServer).on('connection', makeNewContextListener(apiServer, extensionCodec));
    return apiServer;
}

function extractWSServer(options: ApiServerOptions<any>): WebSocket.Server {
    return (options.server instanceof WebSocket.Server
        ? options.server
        : new WebSocket.Server(options)
    );
}

function extractExtensionCodec<CodecContextType>(options: ApiServerOptions<CodecContextType>): PatchedExtensionCodec<CodecContextType> {
    return (options.extensionCodec instanceof PatchedExtensionCodec
        ? options.extensionCodec
        : defaultExtensionCodec as PatchedExtensionCodec<any>
    );
}

function wrapClose(wss: WebSocket.Server) {
    return () => new Promise(
        (resolve, reject) => wss.close(
            err => (err ? reject(err) : resolve())
        )
    );
}

function proxyWSServerEvents(wss: WebSocket.Server, apiServer: EventEmitter) {
    return (wss
        .on('error', (...args) => apiServer.emit('error', ...args))
        .on('listening', (...args) => apiServer.emit('listening', ...args))
        .on('headers', (...args) => apiServer.emit('headers', ...args))
    );
}