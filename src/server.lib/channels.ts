import {ChannelsBase} from '../shared/communications';
import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';
import {normalizeArgs} from './helpers';
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
    Server extends ApiServer<any, Channels<ChannelsInfo>> = ApiServer<any, Channels<ChannelsInfo>>
>(server: Server, channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]): Server;
export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, Channels<ChannelsInfo>> = ApiServer<any, Channels<ChannelsInfo>>
>(channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]): (server: Server) => Server;
export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, Channels<ChannelsInfo>> = ApiServer<any, Channels<ChannelsInfo>>
>(...args: [Server, ChannelName, Channels<ChannelsInfo>[ChannelName]] | [ChannelName, Channels<ChannelsInfo>[ChannelName]]): Server | ((server: Server) => Server) {
    const [server, channelName, channelListener] = normalizeArgs(args);
    const bindListener = createListenerBinder<ChannelsInfo, ChannelName, Server>(channelName, channelListener);
    return server ? bindListener(server) : bindListener;
}

function createListenerBinder<
    ChannelsInfo extends ChannelsBase,
    ChannelName extends keyof ChannelsInfo,
    Server extends ApiServer<any, Channels<ChannelsInfo>> = ApiServer<any, Channels<ChannelsInfo>>
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