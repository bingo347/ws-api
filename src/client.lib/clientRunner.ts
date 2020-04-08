import {
    ProceduresBase,
    ChannelsBase,
    Communication,
    ServerResolveRejectCommunication,
    createCommunication,
    CLIENT_CALL,
    SERVER_RESOLVE,
    SERVER_REJECT,
    MESSAGE,
    PING,
    PONG
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

export type PublicEvents = {
    [EVENT_MESSAGE]: (payload: unknown) => void;
    [EVENT_CLOSE]: CloseFn;
    [EVENT_ERROR]: () => void;
};
export type Sender = (data: Communication) => void;
export type Call<ProceduresInfo extends ProceduresBase> = <ProcedureName extends Exclude<keyof ProceduresInfo, number | symbol>>(
    procedureName: ProcedureName,
    payload: ProceduresInfo[ProcedureName][0]
) => Promise<ProceduresInfo[ProcedureName][1]>
export type Subscribe<ChannelsInfo extends ChannelsBase> = <ChannelName extends keyof ChannelsInfo>(
    channelName: ChannelName,
    cb: (payload: ChannelsInfo[ChannelName]) => void
) => (() => void);

type ResolveReject = [(payload: any) => void, (error: any) => void];
type WaitResult = [number, Record<number, ResolveReject>];

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
        call: makeCall(sender, reciever)
        // TODO: subscribe
    // TODO: remove as
    } as ApiClient<ProceduresInfo, ChannelsInfo>;
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

function waitResult(waitResultsStore: Store<WaitResult>, ...resolveReject: ResolveReject): number {
    return waitResultsStore(([curID, resolveRejectMap]) => [curID + 1, {
        ...resolveRejectMap,
        [curID]: resolveReject
    }])()[0] - 1;
}

function resolveRejectResult(waitResultsStore: Store<WaitResult>, index: 0 | 1) {
    return (comm: ServerResolveRejectCommunication) => waitResultsStore(([curID, resolveRejectMap]) => (
        (resolveRejectMap[comm.id] && resolveRejectMap[comm.id][index](comm.result)),
        [curID, without(comm.id, resolveRejectMap)]
    ));
}