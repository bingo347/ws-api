import {makeObserver} from './observer';

type Notices = {
    notice1: () => void;
    notice2: (arg: number) => void;
    notice3: (arg1: string, arg2: boolean) => void;
};

test('Observe callback called as many times as called notice', () => {
    const [observe, notice] = makeObserver<Notices>();
    const fn = jest.fn<void, []>();
    observe('notice1', fn);
    expect(fn).toHaveBeenCalledTimes(0);
    notice('notice1'); // 1 times
    expect(fn).toHaveBeenCalledTimes(1);
    notice('notice1'); // 2 times
    notice('notice1'); // 3 times
    expect(fn).toHaveBeenCalledTimes(3);
});

test('Observe support many times call', () => {
    const [observe, notice] = makeObserver<Notices>();
    const fn1 = jest.fn<void, []>();
    const fn2 = jest.fn<void, []>();
    observe('notice1', fn1);
    observe('notice1', fn2);
    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(0);
    notice('notice1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
});

test('Observe return unobserve & it work', () => {
    const [observe, notice] = makeObserver<Notices>();
    const fn1 = jest.fn<void, []>();
    const fn2 = jest.fn<void, []>();
    const unsubscribe = observe('notice1', fn1);
    observe('notice1', fn2);
    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(0);
    notice('notice1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    unsubscribe();
    notice('notice1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
});

test('Observe callback called with some args as called notice', () => {
    const [observe, notice] = makeObserver<Notices>();
    const fn2 = jest.fn<void, Parameters<Notices['notice2']>>();
    const fn3 = jest.fn<void, Parameters<Notices['notice3']>>();
    observe('notice2', fn2);
    observe('notice3', fn3);
    notice('notice2', 25);
    notice('notice2', 50);
    notice('notice3', 'test', true);
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