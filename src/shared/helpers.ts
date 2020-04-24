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

export type Fn<Args extends any[] = any[], Result extends any = any> = (...args: Args) => Result;

export const noop = () => void 0;
export const identity = <T>(x: T) => x;

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

export function pipe<F0 extends Fn>(f0: F0): Fn<Parameters<F0>, ReturnType<F0>>;
export function pipe<
    F0 extends Fn,
    F1 extends Fn<[ReturnType<F0>]>
>(f0: F0, f1: F1): Fn<Parameters<F0>, ReturnType<F1>>;
export function pipe<
    F0 extends Fn,
    F1 extends Fn<[ReturnType<F0>]>,
    F2 extends Fn<[ReturnType<F1>]>
>(f0: F0, f1: F1, f2: F2): Fn<Parameters<F0>, ReturnType<F2>>;
export function pipe<
    F0 extends Fn,
    F1 extends Fn<[ReturnType<F0>]>,
    F2 extends Fn<[ReturnType<F1>]>,
    F3 extends Fn<[ReturnType<F2>]>
>(f0: F0, f1: F1, f2: F2, f3: F3): Fn<Parameters<F0>, ReturnType<F3>>;
export function pipe<
    F0 extends Fn,
    F1 extends Fn<[ReturnType<F0>]>,
    F2 extends Fn<[ReturnType<F1>]>,
    F3 extends Fn<[ReturnType<F2>]>,
    F4 extends Fn<[ReturnType<F3>]>
>(f0: F0, f1: F1, f2: F2, f3: F3, f4: F4): Fn<Parameters<F0>, ReturnType<F4>>;
export function pipe(fn: Fn, ...fns: Fn<[any]>[]) {
    const piped = fns.reduce((prev, curr) => x => curr(prev(x)), identity);
    return (...args: any[]) => piped(fn(...args));
}