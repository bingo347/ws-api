import {ApiServerContext} from './context';

type ApiServer<P, C> = {p: P; c: C};

export type Middleware = (
    this: ApiServerContext,
    context: ApiServerContext
) => void | (() => void) | Promise<void | (() => void)> | [Promise<void>, () => void];

export function useMiddleware<Server extends ApiServer<unknown, unknown>>(server: Server, middleware: Middleware): Server;
export function useMiddleware<Server extends ApiServer<unknown, unknown>>(middleware: Middleware): (server: Server) => Server;
export function useMiddleware<Server extends ApiServer<unknown, unknown>>(...args: [Server | Middleware, Middleware?]): Server | ((server: Server) => Server) {
    // TODO:
    return void args as any as Server;
}