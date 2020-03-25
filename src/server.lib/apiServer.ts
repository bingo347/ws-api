import {Server as HTTPServer} from 'http';
import {Server as HTTPSServer} from 'https';
import {ExtensionCodec} from '@msgpack/msgpack';
import WebSocket from 'ws';
import {ProceduresBase, ChannelsBase} from '../shared/communications';
import {Middleware} from './middlewares';
import {Procedures} from './procedures';
import {Channels} from './channels';
import {middlewares, procedures, channels} from './symbols';
import {Store} from './helpers';

export type ApiServerOptions<CodecContextType> = Omit<WebSocket.ServerOptions, 'server'> & {
    server?: WebSocket.Server | HTTPServer | HTTPSServer;
    extensionCodec?: ExtensionCodec<CodecContextType>;
};

export type ApiServer<
    P extends Procedures<ProceduresBase>,
    C extends Channels<ChannelsBase>
> = {
    [middlewares]: Store<Middleware[]>;
    [procedures]: Store<P>;
    [channels]: Store<C>;
    close(): Promise<void>;
};

export function createServer<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase,
    CodecContextType = void
>(options?: ApiServerOptions<CodecContextType>): ApiServer<Procedures<ProceduresInfo>, Channels<ChannelsInfo>> {
    // TODO:
    return void options as any as ApiServer<Procedures<ProceduresInfo>, Channels<ChannelsInfo>>;
}