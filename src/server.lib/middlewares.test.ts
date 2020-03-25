import {useMiddleware} from './middlewares';
import {ApiServer} from './apiServer';
import {createStore} from './helpers';
import {middlewares, procedures, channels} from './symbols';

function createFakeServer(): ApiServer<any, any> {
    return {
        [middlewares]: createStore([]),
        [procedures]: createStore(void 0),
        [channels]: createStore(void 0),
        close() {
            return Promise.resolve();
        }
    };
}

test('useMiddleware return given ApiServer instance', () => {
    const server = createFakeServer();
    expect(useMiddleware(server, () => {})).toBe(server);
});

test('useMiddleware support FP-style call', () => {
    const server = createFakeServer();
    const binder = useMiddleware(() => {});
    expect(typeof binder).toBe('function');
    expect(binder(server)).toBe(server);
});

test('useMiddleware add middleware to end of array in middlewares store', () => {
    const server = createFakeServer();
    const middlewareStore = server[middlewares];
    const middleware1 = () => {};
    const middleware2 = () => {};

    useMiddleware(server, middleware1);
    expect(middlewareStore()).toHaveLength(1);
    expect(middlewareStore()[0]).toBe(middleware1);

    useMiddleware(server, middleware2);
    expect(middlewareStore()).toHaveLength(2);
    expect(middlewareStore()[0]).toBe(middleware1);
    expect(middlewareStore()[1]).toBe(middleware2);
});