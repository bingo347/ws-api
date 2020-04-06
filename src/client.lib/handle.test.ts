import {createHandle} from './handle';

type Events = {
    event1: () => void;
    event2: (arg: number) => void;
    event3: (arg1: string, arg2: boolean) => void;
};

test('Handle callback called as many times as called emit', () => {
    const [handle, emit] = createHandle<Events>();
    const fn = jest.fn<void, []>();
    handle('event1', fn);
    expect(fn).toHaveBeenCalledTimes(0);
    emit('event1'); // 1 times
    expect(fn).toHaveBeenCalledTimes(1);
    emit('event1'); // 2 times
    emit('event1'); // 3 times
    expect(fn).toHaveBeenCalledTimes(3);
});

test('Handle support many times call', () => {
    const [handle, emit] = createHandle<Events>();
    const fn1 = jest.fn<void, []>();
    const fn2 = jest.fn<void, []>();
    handle('event1', fn1);
    handle('event1', fn2);
    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(0);
    emit('event1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
});

test('Handle callback called with some args as called emit', () => {
    const [handle, emit] = createHandle<Events>();
    const fn2 = jest.fn<void, Parameters<Events['event2']>>();
    const fn3 = jest.fn<void, Parameters<Events['event3']>>();
    handle('event2', fn2);
    handle('event3', fn3);
    emit('event2', 25);
    emit('event2', 50);
    emit('event3', 'test', true);
    expect(fn2.mock.calls).toHaveLength(2);
    expect(fn2.mock.calls[0]).toHaveLength(1);
    expect(fn2.mock.calls[0][0]).toBe(25);
    expect(fn2.mock.calls[1]).toHaveLength(1);
    expect(fn2.mock.calls[1][0]).toBe(50);
    expect(fn3.mock.calls).toHaveLength(1);
    expect(fn3.mock.calls[0]).toHaveLength(2);
    expect(fn3.mock.calls[0][0]).toBe('test');
    expect(fn3.mock.calls[0][1]).toBe(true);
});