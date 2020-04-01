import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';
import {normalizeArgs} from './helpers';
import {middlewares} from './symbols';

export type Middleware = (
    this: ApiServerContext,
    context: ApiServerContext
) => void | Promise<void>;

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

export function runMiddlewares(ctx: ApiServerContext, server: ApiServer<any, any>): Promise<void> {
    return server[middlewares]().reduce(
        (p, middleware) => p.then(() => middleware.call(ctx, ctx)),
        Promise.resolve()
    );
}