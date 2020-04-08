import {
    ProceduresBase,
    ChannelsBase,
    Communication,
    ServerResolveRejectCommunication,
    ServerPublishCommunication,
    createCommunication,
    CLIENT_CALL,
    SERVER_RESOLVE,
    SERVER_REJECT,
    MESSAGE,
    PING,
    PONG,
    SERVER_PUBLISH,
    CLIENT_SUBSCRIBE,
    CLIENT_UNSUBSCRIBE
} from '../shared/communications';
import {RecieverEvents} from './reciever';
import {CloseFn} from './close';
import {Handle} from './handle';
import {
    EVENT_CLOSE,
    EVENT_ERROR,
    EVENT_MESSAGE
} from './events';
import {Store, createStore, without} from './helpers';
import {ApiClient} from './apiClient';

type OnlyStringKeys<T extends Record<string | number | symbol, any>> = Exclude<keyof T, number | symbol>;
type ResolveReject = [(payload: any) => void, (error: any) => void];
type WaitResult = [number, Record<number, ResolveReject>];
type Subscriber = (payload: any) => void;
type SubscribersRecord = Record<string, Subscriber[]>;

export type PublicEvents = {
    [EVENT_MESSAGE]: (payload: unknown) => void;
    [EVENT_CLOSE]: CloseFn;
    [EVENT_ERROR]: () => void;
};
export type Sender = (data: Communication) => void;
export type Call<ProceduresInfo extends ProceduresBase> = <ProcedureName extends OnlyStringKeys<ProceduresInfo>>(
    procedureName: ProcedureName,
    payload: ProceduresInfo[ProcedureName][0]
) => Promise<ProceduresInfo[ProcedureName][1]>
export type Subscribe<ChannelsInfo extends ChannelsBase> = <ChannelName extends OnlyStringKeys<ChannelsInfo>>(
    channelName: ChannelName,
    cb: (payload: ChannelsInfo[ChannelName]) => void
) => (() => void);

export function runClient<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(
    sender: Sender,
    reciever: Handle<RecieverEvents>,
    handle: Handle<PublicEvents>,
    close: CloseFn
): ApiClient<ProceduresInfo, ChannelsInfo> {
    reciever(PING, () => sender(createCommunication(PONG)));
    return {
        handle, close,
        send: payload => sender(createCommunication(MESSAGE, payload)),
        call: makeCall(sender, reciever),
        subscribe: makeSubscribe(sender, reciever)
    };
}

function makeCall<ProceduresInfo extends ProceduresBase>(sender: Sender, reciever: Handle<RecieverEvents>): Call<ProceduresInfo> {
    const waitResultsStore = createStore<WaitResult>([0, {}]);
    return (
        reciever(SERVER_RESOLVE, resolveRejectResult(waitResultsStore, 0)),
        reciever(SERVER_REJECT, resolveRejectResult(waitResultsStore, 1)),
        (procedureName, payload) => new Promise((resolve, reject) => sender(createCommunication(
            CLIENT_CALL,
            waitResult(waitResultsStore, resolve, reject),
            procedureName,
            payload
        )))
    );
}

function makeSubscribe<ChannelsInfo extends ChannelsBase>(sender: Sender, reciever: Handle<RecieverEvents>): Subscribe<ChannelsInfo> {
    const subscribersStore = createStore<SubscribersRecord>({});
    return (
        reciever(SERVER_PUBLISH, runSubscribers(subscribersStore)),
        (channelName, cb) => (
            addSubscriber(sender, subscribersStore, channelName, cb),
            () => removeSubscriber(sender, subscribersStore, channelName, cb)
        )
    );
}

function resolveRejectResult(waitResultsStore: Store<WaitResult>, index: 0 | 1) {
    return (comm: ServerResolveRejectCommunication) => waitResultsStore(([curID, resolveRejectMap]) => (
        (resolveRejectMap[comm.id] && resolveRejectMap[comm.id][index](comm.result)),
        [curID, without(comm.id, resolveRejectMap)]
    ));
}

function waitResult(waitResultsStore: Store<WaitResult>, ...resolveReject: ResolveReject): number {
    return waitResultsStore(([curID, resolveRejectMap]) => [curID + 1, {
        ...resolveRejectMap,
        [curID]: resolveReject
    }])()[0] - 1;
}

function runSubscribers(subscribersStore: Store<SubscribersRecord>) {
    return (comm: ServerPublishCommunication) => (
        subscribersStore()[comm.channel] || []
    ).forEach(cb => cb(comm.payload));
}

function addSubscriber(sender: Sender, subscribersStore: Store<SubscribersRecord>, channelName: string, cb: Subscriber) {
    return subscribersStore(subscribers => ({
        ...subscribers,
        [channelName]: (subscribers[channelName]
            ? [...subscribers[channelName], cb]
            : (sender(createCommunication(CLIENT_SUBSCRIBE, channelName)), [cb])
        )
    }));
}

function removeSubscriber(sender: Sender, subscribersStore: Store<SubscribersRecord>, channelName: string, cb: Subscriber) {
    return subscribersStore(subscribers => (!subscribers[channelName]
        ? subscribers
        : (subscribers[channelName].length === 1
            ? (subscribers[channelName][0] === cb
                ? (sender(createCommunication(CLIENT_UNSUBSCRIBE, channelName)), without(channelName, subscribers))
                : subscribers
            )
            : ({
                ...subscribers,
                [channelName]: subscribers[channelName].filter(checkedCB => checkedCB !== cb)
            })
        )
    ));
}