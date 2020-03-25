import {ChannelsBase} from '../shared/communications';
import {ApiServerContext} from './context';

type ApiServer<P, C> = {p: P; c: C};

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
    Server extends ApiServer<unknown, Channels<ChannelsInfo>>,
    ChannelName extends keyof ChannelsInfo
>(server: Server, channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]): Server;
export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    Server extends ApiServer<unknown, Channels<ChannelsInfo>>,
    ChannelName extends keyof ChannelsInfo
>(channelName: ChannelName, channelListener: Channels<ChannelsInfo>[ChannelName]): (server: Server) => Server;
export function mountChannel<
    ChannelsInfo extends ChannelsBase,
    Server extends ApiServer<unknown, Channels<ChannelsInfo>>,
    ChannelName extends keyof ChannelsInfo
>(...args: [Server | ChannelName, ChannelName | Channels<ChannelsInfo>[ChannelName], Channels<ChannelsInfo>[ChannelName]?]): Server | ((server: Server) => Server) {
    // TODO:
    return void args as any as Server;
}
