import {makeCell, get, update} from '@lambda-fn/cell';

export type Store<T> = {
    (): T;
    (updater: (value: T) => T): Store<T>;
};
export type Fn<Args extends any[] = any[], Result extends any = any> = (...args: Args) => Result;
export type VoidFn<Args extends any[] = any[]> = Fn<Args, void>;
export type Key = string | number | symbol;
export type Keys<T extends Record<Key, any>, Without extends Key = never> = Exclude<keyof T, Without>;

export const VOID: void = void 0;
export const noop: VoidFn = () => VOID;
export const identity = <T>(x: T) => x;

export function partial<T0, TS extends any[], R>(
    fn: (x0: T0, ...xs: TS) => R,
    x0: T0
): Fn<TS, R>;
export function partial<T0, T1, TS extends any[], R>(
    fn: (x0: T0, x1: T1, ...xs: TS) => R,
    x0: T0, x1: T1
): Fn<TS, R>;
export function partial<T0, T1, T2, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2
): Fn<TS, R>;
export function partial<T0, T1, T2, T3, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, x3: T3, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2, x3: T3
): Fn<TS, R>;
export function partial<T0, T1, T2, T3, T4, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, x3: T3, x4: T4, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2, x3: T3, x4: T4
): Fn<TS, R>;
export function partial<T0, T1, T2, T3, T4, T5, TS extends any[], R>(
    fn: (x0: T0, x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, ...xs: TS) => R,
    x0: T0, x1: T1, x2: T2, x3: T3, x4: T4, x5: T5
): Fn<TS, R>;
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

export function withEffect<T>(f: VoidFn<[T]>): Fn<[T], T> {
    return v => (f(v), v);
}

export function without<T extends Record<string | number, any>>(key: keyof T, obj: T): T {
    const keys = Object.keys(obj).filter(k => k !== key);
    return keys.reduce((acc, k) => ({
        ...acc,
        [k]: obj[k]
    }), {} as T);
}

export function createStore<T>(initValue: T) {
    const cell = makeCell(initValue);
    function store(): T;
    function store(updater: (value: T) => T): Store<T>;
    function store(updater?: (value: T) => T): T | Store<T> {
        return (updater
            ? (update(cell, updater), store)
            : get(cell)
        );
    }
    return store;
}
