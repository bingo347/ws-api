import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';
import {normalizeArgs} from './helpers';
import {middlewares} from './symbols';

export type Middleware = (
    this: ApiServerContext,
    context: ApiServerContext
) => void | (() => void) | Promise<void | (() => void)> | [Promise<void>, () => void];

export function useMiddleware<Server extends ApiServer<any, any>>(server: Server, middleware: Middleware): Server;
export function useMiddleware<Server extends ApiServer<any, any>>(middleware: Middleware): (server: Server) => Server;
export function useMiddleware<Server extends ApiServer<any, any>>(...args: [Server, Middleware] | [Middleware]): Server | ((server: Server) => Server) {
    const [server, middleware] = normalizeArgs(args);
    const bindMiddelware = createMiddlewareBinder<Server>(middleware);
    return server ? bindMiddelware(server) : bindMiddelware;
}

function createMiddlewareBinder<Server extends ApiServer<any, any>>(middleware: Middleware) {
    return (server: Server) => (server[middlewares](prevMiddlewares => [...prevMiddlewares, middleware]), server);
}