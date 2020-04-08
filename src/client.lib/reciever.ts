import {Communication, CommunicationByTag, isPackedCommunication, unpackCommunication} from '../shared/communications';
import {Decoder} from '../shared/msgpack-extensions';
import {Store, createStore} from './helpers';
import {Handle, createHandle} from './handle';
import {OutEvents} from './connection';
import {EVENT_MESSAGE, EVENT_OPEN} from './events';

export type RecieverEvents = {
    [T in Communication['tag']]: (c: CommunicationByTag<T>) => void;
};
type Emit = (e: Communication['tag'], c: Communication) => void;

export function createReciever(handleSocket: Handle<OutEvents>, decode: Decoder) {
    const [handle, emit] = createHandle<RecieverEvents>();
    const queueStore = createStore<false | Communication[]>([]);
    const unpackAndEmit = makeUnpacker(makeSmartEmit(emit as Emit, queueStore));
    return (
        handleSocket(EVENT_OPEN, makeQueueEmitter(emit as Emit, queueStore)),
        handleSocket(EVENT_MESSAGE, data => unpackAndEmit(decode(data))),
        handle
    );
}

function makeSmartEmit(emit: Emit, queueStore: Store<false | Communication[]>) {
    const communicationEmitter = makeCommunicationEmitter(emit);
    return (comm: void | Communication) => comm && (
        queueStore(makeQueueUpdater(comm))() || communicationEmitter(comm)
    );
}

function makeUnpacker(emit: (comm: void | Communication) => void) {
    return (decodedData: unknown) => (isPackedCommunication(decodedData)
        && emit(unpackCommunication(decodedData))
    );
}

function makeQueueEmitter(emit: Emit, queueStore: Store<false | Communication[]>) {
    const communicationEmitter = makeCommunicationEmitter(emit);
    return () => queueStore(queue => (
        (queue && queue.forEach(communicationEmitter)),
        false
    ));
}

function makeCommunicationEmitter(emit: Emit) {
    return (comm: Communication) => emit(comm.tag, comm);
}

function makeQueueUpdater(comm: Communication) {
    return (queue: false | Communication[]) => queue && [...queue, comm];
}