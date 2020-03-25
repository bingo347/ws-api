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
