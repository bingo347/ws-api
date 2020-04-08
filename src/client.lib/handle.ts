import {createStore, Store} from './helpers';

export type EventsBase = Record<string | number, (...args: any[]) => void>;
export type Handle<Events extends EventsBase>
    = <K extends keyof Events>(event: K, cb: Events[K]) => (() => void);
export type Emit<Events extends EventsBase>
    = <K extends keyof Events>(event: K, ...params: Parameters<Events[K]>) => void;

type StoredEvents<Events extends EventsBase> = {
    [K in keyof Events]: Events[K][];
};
type EventsStore<Events extends EventsBase> = Store<StoredEvents<Events>>;

export function createHandle<Events extends EventsBase>(): [Handle<Events>, Emit<Events>] {
    const eventsStore = createStore({} as StoredEvents<Events>);
    return [makeHandle(eventsStore), makeEmit(eventsStore)];
}

function makeHandle<Events extends EventsBase>(eventsStore: EventsStore<Events>): Handle<Events> {
    return <K extends keyof Events>(event: K, cb: Events[K]) => (
        eventsStore(addEvevntCB(event, cb)),
        () => void eventsStore(removeEvevntCB(event, cb))
    );
}

function makeEmit<Events extends EventsBase>(eventsStore: EventsStore<Events>): Emit<Events> {
    return <K extends keyof Events>(event: K, ...params: Parameters<Events[K]>) => {
        const eventHandle = eventsStore()[event];
        return eventHandle && eventHandle.forEach(h => h(...params));
    };
}

function addEvevntCB<Events extends EventsBase>(event: keyof Events, cb: Events[keyof Events]) {
    return (events: StoredEvents<Events>) => ({
        ...events,
        [event]: (events[event] ? [...events[event], cb] : [cb])
    });
}

function removeEvevntCB<Events extends EventsBase>(event: keyof Events, cb: Events[keyof Events]) {
    return (events: StoredEvents<Events>) => (!events[event]
        ? events
        : (events[event].length === 1
            // eslint-disable-next-line fp/no-delete
            ? ((events[event][0] === cb && delete events[event]), events)
            : ({
                ...events,
                [event]: events[event].filter(checkedCB => checkedCB !== cb)
            })
        )
    );
}