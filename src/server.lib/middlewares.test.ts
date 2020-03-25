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
    expect(useMiddleware(server, () => {})).toEqual(server);
});

test('useMiddleware support FP-style call', () => {
    const server = createFakeServer();
    const binder = useMiddleware(() => {});
    expect(typeof binder).toEqual('function');
    expect(binder(server)).toEqual(server);
});

test('useMiddleware add middleware to end of array in middlewares store', () => {
    const server = createFakeServer();
    const middlewareStore = server[middlewares];
    const middleware1 = () => {};
    const middleware2 = () => {};

    useMiddleware(server, middleware1);
    expect(middlewareStore().length).toEqual(1);
    expect(middlewareStore()[0]).toEqual(middleware1);

    useMiddleware(server, middleware2);
    expect(middlewareStore().length).toEqual(2);
    expect(middlewareStore()[0]).toEqual(middleware1);
    expect(middlewareStore()[1]).toEqual(middleware2);
});