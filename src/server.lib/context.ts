import {IncomingMessage} from 'http';
import WebSocket from 'ws';
import {ProceduresBase, ChannelsBase} from '../shared/communications';
import {ApiServer} from './apiServer';
import {Procedures} from './procedures';
import {Channels} from './channels';
import {PatchedExtensionCodec} from '../shared/msgpack';
import {Store, createStore} from './helpers';

export type ApiServerContext = {
    socket: WebSocket;
    request: IncomingMessage;
    session: Store<Record<string | symbol, any>>;
    close(code?: number, reason?: string): void;
};

export function makeNewContextListener<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase,
    CodecContextType = undefined
>(
    apiServer: ApiServer<Procedures<ProceduresInfo>, Channels<ChannelsInfo>>,
    extensionCodec: PatchedExtensionCodec<CodecContextType>
) {
    return (socket: WebSocket, request: IncomingMessage) => {
        const ctx = createContext(socket, request);
        // TODO:
        return void [ctx, apiServer, extensionCodec];
    };
}

function createContext(socket: WebSocket, request: IncomingMessage): ApiServerContext {
    return {
        socket,
        request,
        session: createStore({}),
        close: (code, reason) => socket.close(code, reason)
    };
}