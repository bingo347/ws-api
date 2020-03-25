import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';

export type Middleware = (
    this: ApiServerContext,
    context: ApiServerContext
) => void | (() => void) | Promise<void | (() => void)> | [Promise<void>, () => void];

export function useMiddleware<Server extends ApiServer<any, any>>(server: Server, middleware: Middleware): Server;
export function useMiddleware<Server extends ApiServer<any, any>>(middleware: Middleware): (server: Server) => Server;
export function useMiddleware<Server extends ApiServer<any, any>>(...args: [Server | Middleware, Middleware?]): Server | ((server: Server) => Server) {
    // TODO:
    return void args as any as Server;
}