import {ApiServer} from './apiServer';
import {middlewares, procedures, channels} from './symbols';

export function isApiServer(s: unknown): s is ApiServer<any, any> {
    return (typeof s === 'object'
        && s !== null
        && middlewares in s
        && procedures in s
        && channels in s
    );
}

export function normalizeArgs(args: [any]): never;
export function normalizeArgs<T0, Server extends ApiServer<any, any>>(args: [Server, T0] | [T0]): [Server | void, T0];
export function normalizeArgs<T0, T1, Server extends ApiServer<any, any>>(args: [Server, T0, T1] | [T0, T1]): [Server | void, T0, T1];
export function normalizeArgs<Server extends ApiServer<any, any>>(args: [any, ...any[]]): [Server | void, ...any[]] {
    return isApiServer(args[0]) ? args : [void 0, ...args];
}

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
            ? (value = updater(value))
            : value
        );
    }
    return store;
}

export const noop = () => void 0;