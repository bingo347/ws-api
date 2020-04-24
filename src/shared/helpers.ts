export type Store<T> = {
    (): T;
    (updater: (value: T) => T): Store<T>;
};
export function createStore<T>(initValue: T) {
    // eslint-disable-next-line immutable/no-let
    let value = initValue;
    function store(): T;
    function store(updater: (value: T) => T): Store<T>;
    function store(updater?: (value: T) => T): T | Store<T> {
        return (updater
            // eslint-disable-next-line fp/no-mutation
            ? ((value = updater(value)), store)
            : value
        );
    }
    return store;
}

export const noop = () => void 0;

export function partial<T0, TS extends any[], R>(
    fn: (x0: T0, ...xs: TS) => R,
    x0: T0
): (...xs: TS) => R;
export function partial<T0, T1, TS extends any[], R>(
    fn: (x0: T0, x1: T1, ...xs: TS) => R,
    x0: T0, x1: T1
): (...xs: TS) => R;
export function partial<T0, T1, T2, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2
): (...xs: TS) => R;
export function partial<T0, T1, T2, T3, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, x3: T3, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2, x3: T3
): (...xs: TS) => R;
export function partial<T0, T1, T2, T3, T4, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, x3: T3, x4: T4, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2, x3: T3, x4: T4
): (...xs: TS) => R;
export function partial<T0, T1, T2, T3, T4, T5, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2, x3: T3, x4: T4, x5: T5
): (...xs: TS) => R;
export function partial(fn: (...args: any[]) => any, ...head: any[]) {
    return (...tail: any[]) => fn(...head, ...tail);
}
