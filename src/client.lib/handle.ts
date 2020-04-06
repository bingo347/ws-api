import {createStore, Store} from './helpers';

type EventsBase = Record<string, (...args: any[]) => void>;
type Handle<Events extends EventsBase>
    = <K extends keyof Events>(event: K, cb: Events[K]) => void;
type Emitter<Events extends EventsBase>
    = <K extends keyof Events>(event: K, ...params: Parameters<Events[K]>) => void;
type StoredEvents<Events extends EventsBase> = {
    [K in keyof Events]: Events[K][];
};
type EventsStore<Events extends EventsBase> = Store<StoredEvents<Events>>;

export function createHandle<Events extends EventsBase>(): [Handle<Events>, Emitter<Events>] {
    const eventsStore = createStore({} as StoredEvents<Events>);
    return [makeHandle(eventsStore), makeEmit(eventsStore)];
}

function makeHandle<Events extends EventsBase>(eventsStore: EventsStore<Events>): Handle<Events> {
    return <K extends keyof Events>(event: K, cb: Events[K]): void => void eventsStore(events => ({
        ...events,
        [event]: (events[event] ? [...events[event], cb] : [cb])
    }));
}

function makeEmit<Events extends EventsBase>(eventsStore: EventsStore<Events>): Emitter<Events> {
    return <K extends keyof Events>(event: K, ...params: Parameters<Events[K]>) => {
        const eventHandle = eventsStore()[event];
        return eventHandle && eventHandle.forEach(h => h(...params));
    };
}