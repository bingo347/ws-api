import {Server as HTTPServer} from 'http';
import {ExtensionCodec} from '@msgpack/msgpack';
import WebSocket from 'ws';
import {ProceduresBase, ChannelsBase} from '../shared/communications';
import {Middleware} from './middlewares';
import {Procedures} from './procedures';
import {Channels} from './channels';
import {middlewares, procedures, channels} from './symbols';

export type ApiServerOptions<CodecContextType> = {
    server?: WebSocket.Server | HTTPServer;
    extensionCodec?: ExtensionCodec<CodecContextType>;
};

export type ApiServer<
    P extends Procedures<ProceduresBase>,
    C extends Channels<ChannelsBase>
> = {
    [middlewares]: Middleware[];
    [procedures]: P;
    [channels]: C;
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