import {EventEmitter} from 'events';
import {ApiServer} from './apiServer';
import {ApiServerContext} from './context';
import {runMiddlewares} from './middlewares';
import {runProcedure} from './procedures';
import {runChannelListener} from './channels';
import {
    ProceduresBase,
    ChannelsBase,
    Communication,
    createCommunication,
    PING,
    PONG,
    CLIENT_CALL,
    CLIENT_SUBSCRIBE,
    CLIENT_UNSUBSCRIBE,
    SERVER_RESOLVE,
    SERVER_REJECT,
    SERVER_PUBLISH
} from '../shared/communications';
import {
    send,
    pong,
    communication
} from './symbols';
import {createStore, noop} from './helpers';

export function createContextRunner<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(ctx: ApiServerContext, emitter: EventEmitter, apiServer: ApiServer<ProceduresInfo, ChannelsInfo>) {
    return () => (
        handleCommunication(emitter, (comm: Communication) => (
            (comm.tag === PING && ctx[send](createCommunication(PONG)))
            || (comm.tag === PONG && ctx.ping[pong]())
        )),
        Promise.all([
            ctx.ping(),
            runMiddlewares(ctx, apiServer)
        ]).then(() => handleCommunication(emitter, runContext(ctx, apiServer)))
    );
}

// eslint-disable-next-line max-lines-per-function
function runContext<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(ctx: ApiServerContext, apiServer: ApiServer<ProceduresInfo, ChannelsInfo>) {
    const unsubscribersStore = createStore<Record<string, () => void>>({});
    const unhandle: () => void = ctx.handle('close', () => {
        const unsubscribers = unsubscribersStore();
        Object.keys(unsubscribers).forEach(key => unsubscribers[key]());
        return unhandle();
    });
    // eslint-disable-next-line max-lines-per-function
    return (comm: Communication) => {
        switch(comm.tag) {
        case CLIENT_CALL:
            runProcedure(ctx, apiServer, comm)
                .then(result => ctx[send](createCommunication(SERVER_RESOLVE, comm.id, result)))
                .catch((err: Error) => ctx[send](createCommunication(SERVER_REJECT, comm.id, err)));
            break;
        case CLIENT_SUBSCRIBE:
            unsubscribersStore(unsubscribers => ((unsubscribers[comm.channel] || noop)(), {
                ...unsubscribers,
                [comm.channel]: runChannelListener(ctx, apiServer, comm, payload => ctx[send](createCommunication(SERVER_PUBLISH, comm.channel, payload)))
            }));
            break;
        case CLIENT_UNSUBSCRIBE:
            unsubscribersStore(unsubscribers => (
                (unsubscribers[comm.channel] || noop)(),
                // eslint-disable-next-line fp/no-delete
                (delete unsubscribers[comm.channel]),
                unsubscribers
            ));
            break;
        }
        return void 0;
    };
}

function handleCommunication(emitter: EventEmitter, listener: (c: Communication) => void) {
    return (
        emitter.on(communication, listener),
        emitter.once('close', () => emitter.off(communication, listener))
    );
}