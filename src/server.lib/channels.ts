import {ChannelsBase, ClientSubscribeUnsubscribeCommunication} from '../shared/communications';
import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';
import {normalizeArgs, noop} from './helpers';
import {channels} from './symbols';

export type ChannelListener<Payload> = (
    this: ApiServerContext,
    publish: (payload: Payload) => void,
    context: ApiServerContext
) => void | (() => void)

export type Channels<ChannelsInfo extends ChannelsBase> = {
    [K in keyof ChannelsInfo]: ChannelListener<ChannelsInfo[K]>;
};

export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, ChannelsInfo> = ApiServer<any, ChannelsInfo>
>(server: Server, channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]): Server;
export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, ChannelsInfo> = ApiServer<any, ChannelsInfo>
>(channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]): (server: Server) => Server;
export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, ChannelsInfo> = ApiServer<any, ChannelsInfo>
>(...args: [Server, ChannelName, Channels<ChannelsInfo>[ChannelName]] | [ChannelName, Channels<ChannelsInfo>[ChannelName]]): Server | ((server: Server) => Server) {
    const [server, channelName, channelListener] = normalizeArgs(args);
    const bindListener = createListenerBinder<ChannelsInfo, ChannelName, Server>(channelName, channelListener);
    return server ? bindListener(server) : bindListener;
}

function createListenerBinder<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, ChannelsInfo> = ApiServer<any, ChannelsInfo>
>(channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]) {
    return (server: Server) => {
        if(channelName in server[channels]()) {
            // eslint-disable-next-line fp/no-throw
            throw new Error(`Cannot mount channel "${channelName}" to the some server twice`);
        }
        server[channels](prevListeners => ({
            ...prevListeners,
            [channelName]: channelListener
        }));
        return server;
    };
}

export function runChannelListener<
    ChannelsInfo extends ChannelsBase
>(
    ctx: ApiServerContext,
    server: ApiServer<any, ChannelsInfo>,
    comm: ClientSubscribeUnsubscribeCommunication,
    publish: (payload: unknown) => void
): () => void {
    const channelListener = server[channels]()[comm.channel];
    return (channelListener && channelListener.call(ctx, publish, ctx)) || noop;
}