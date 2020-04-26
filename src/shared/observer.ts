import {Cell, makeCell, update, get} from '@lambda-fn/cell';
import {Option, fromNullable, map, filter, unwrapOr} from '@lambda-fn/option';
import {VOID, Key, Keys, VoidFn, pipe, withEffect, without} from './utils';

export type NoticesBase = Record<Key, VoidFn>;
export type Observe<Notices extends NoticesBase> = <N extends Keys<Notices>>(name: N, callback: Notices[N]) => VoidFn<[]>;
export type Notice<Notices extends NoticesBase> = <N extends Keys<Notices>>(name: N, ...params: Parameters<Notices[N]>) => void;

type Observer<Notices extends NoticesBase, N extends Keys<Notices> = Keys<Notices>> = Set<Notices[N]>;
type StoredObservers<Notices extends NoticesBase> = {
    [N in Keys<Notices>]: Observer<Notices, N>;
};
type ObserversCell<Notices extends NoticesBase> = Cell<StoredObservers<Notices>>;

export function makeObserver<Notices extends NoticesBase>(): [Observe<Notices>, Notice<Notices>] {
    const observersCell = makeCell({} as StoredObservers<Notices>);
    return [makeObserve(observersCell), makeNotice(observersCell)];
}

function makeObserve<Notices extends NoticesBase>(observersCell: ObserversCell<Notices>): Observe<Notices> {
    return <N extends Keys<Notices>>(name: N, callback: Notices[N]) => (
        observe(observersCell, name, callback),
        () => unobserve(observersCell, name, callback)
    );
}

function makeNotice<Notices extends NoticesBase>(observersCell: ObserversCell<Notices>): Notice<Notices> {
    return <N extends Keys<Notices>>(name: N, ...params: Parameters<Notices[N]>) => pipe(
        map(noticeObserverWithParams(params)),
        unwrapOr(VOID)
    )(getObserverByName(observersCell, name));
}

function observe<
    Notices extends NoticesBase,
    N extends Keys<Notices>
>(observersCell: ObserversCell<Notices>, name: N, callback: Notices[N]) {
    return update(observersCell, observers => ({
        ...observers,
        [name]: (observers[name] || new Set()).add(callback)
    }));
}

function unobserve<
    Notices extends NoticesBase,
    N extends Keys<Notices>
>(observersCell: ObserversCell<Notices>, name: N, callback: Notices[N]) {
    return pipe(
        map(withEffect(deleteCallbackFromObserver(callback))),
        filter((observer: Observer<Notices>) => observer.size !== 0),
        map(dropObserver(observersCell, name)),
        unwrapOr(VOID)
    )(getObserverByName(observersCell, name));
}

function getObserverByName<
    Notices extends NoticesBase,
    N extends Keys<Notices>
>(observersCell: ObserversCell<Notices>, name: N): Option<Observer<Notices, N>> {
    return fromNullable(get(observersCell)[name]);
}

function deleteCallbackFromObserver<Notices extends NoticesBase>(callback: Notices[Keys<Notices>]) {
    return (observer: Observer<Notices>) => observer.delete(callback);
}

function dropObserver<
    Notices extends NoticesBase,
    N extends Keys<Notices>
>(observersCell: ObserversCell<Notices>, name: N) {
    return () => update(
        observersCell,
        observers => without(name, observers)
    );
}

function noticeObserverWithParams<Notices extends NoticesBase>(params: Parameters<Notices[Keys<Notices>]>) {
    function iterate(iterator: Iterator<Notices[Keys<Notices>]>): void {
        const {value, done} = iterator.next();
        if(done) { return VOID; }
        return (
            (value as Notices[Keys<Notices>])(...params),
            iterate(iterator)
        );
    }
    return (observer: Observer<Notices>) => iterate(observer.values());
}