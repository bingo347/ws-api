import {mountProcedure, Procedures} from './procedures';
import {ApiServer} from './apiServer';
import {createStore} from './helpers';
import {middlewares, procedures, channels} from './symbols';

const procedure1 = (payload: number) => String(payload);
const procedure2 = (payload: string) => parseFloat(payload);

type ProceduresInfo = {
    procedure1: [Parameters<typeof procedure1>[0], ReturnType<typeof procedure1>];
    procedure2: [Parameters<typeof procedure2>[0], ReturnType<typeof procedure2>];
};

function createFakeServer(): ApiServer<Procedures<ProceduresInfo>, any> {
    return {
        [middlewares]: createStore([]),
        [procedures]: createStore({}),
        [channels]: createStore(void 0),
        close() {
            return Promise.resolve();
        }
    };
}

test('mountProcedure return given ApiServer instance', () => {
    const server = createFakeServer();
    expect(mountProcedure<ProceduresInfo, 'procedure1'>(server, 'procedure1', procedure1)).toBe(server);
});

test('mountProcedure support FP-style call', () => {
    const server = createFakeServer();
    const binder = mountProcedure<ProceduresInfo, 'procedure1'>('procedure1', procedure1);
    expect(typeof binder).toBe('function');
    expect(binder(server)).toBe(server);
});

test('mountProcedure throws error when mount the some procedure name to the some server twice', () => {
    const server = createFakeServer();
    mountProcedure<ProceduresInfo, 'procedure1'>(server, 'procedure1', procedure1);
    expect(() => (
        mountProcedure<ProceduresInfo, 'procedure1'>(server, 'procedure1', _ => `${_}`)
    )).toThrow('Cannot mount procedure "procedure1" to the some server twice');
});

test('mountProcedure add procedure to procedures store as the some name', () => {
    const server = createFakeServer();
    const proceduresStore = server[procedures];

    mountProcedure<ProceduresInfo, 'procedure1'>(server, 'procedure1', procedure1);
    expect(proceduresStore().procedure1).toBe(procedure1);
    expect(proceduresStore().procedure2).toBe(void 0);

    mountProcedure<ProceduresInfo, 'procedure2'>(server, 'procedure2', procedure2);
    expect(proceduresStore().procedure1).toBe(procedure1);
    expect(proceduresStore().procedure2).toBe(procedure2);
});