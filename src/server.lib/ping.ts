import {
    Communication,
    createCommunication,
    PING
} from '../shared/communications';
import {noop, createStore, Store} from './helpers';
import {pong} from './symbols';

type PongAwaiter = {
    resolve(): void;
    timer: void | NodeJS.Timeout;
};
type PromiseExecutor = (resolve: () => void, reject: (reason?: any) => void) => void;

const getInitialPongAwaiterValue = (): PongAwaiter => ({resolve: noop, timer: void 0});
const makePong = (pongAwaiter: Store<PongAwaiter>) => () => (
    pongAwaiter().resolve(),
    pongAwaiter(getInitialPongAwaiterValue),
    void 0
);
const getLastResolve = (pongAwaiter: Store<PongAwaiter>) => {
    const {timer, resolve} = pongAwaiter();
    timer && clearTimeout(timer);
    return resolve;
};
const wrapPromiseExecutor = (
    lastResolve: () => void,
    executor: PromiseExecutor
): PromiseExecutor => (lastResolve === noop
    ? executor
    : ((resolve, reject) => executor(() => (lastResolve(), resolve()), reject))
);
const rejectOnTimeout = (
    timeout: number,
    reject: (reason?: any) => void
) => setTimeout(() => reject(new Error('pong timeout')), timeout);
const makePongAwaiterUpdate = (
    timeout: number,
    resolve: () => void,
    reject: (reason?: any) => void
) => (timeout > 0
    ? (() => ({resolve, timer: rejectOnTimeout(timeout, reject)}))
    : (() => ({resolve, timer: void 0}))
);
const makePongAwaiterPromiseExecutor = (
    timeout: number,
    pongAwaiter: Store<PongAwaiter>,
    sender: (data: Communication) => void
) => wrapPromiseExecutor(
    getLastResolve(pongAwaiter),
    (resolve, reject) => (
        pongAwaiter(makePongAwaiterUpdate(timeout, resolve, reject)),
        sender(createCommunication(PING))
    )
);

export function createPinger(sender: (data: Communication) => void) {
    const pongAwaiter = createStore<PongAwaiter>(getInitialPongAwaiterValue());
    return Object.assign((timeout = -1) => (
        new Promise(
            makePongAwaiterPromiseExecutor(timeout, pongAwaiter, sender)
        ).finally(
            () => pongAwaiter(getInitialPongAwaiterValue)
        )
    ), {
        [pong]: makePong(pongAwaiter)
    });
}