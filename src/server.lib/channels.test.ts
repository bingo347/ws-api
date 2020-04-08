import {mountChannel, ChannelListener} from './channels';
import {ApiServer} from './apiServer';
import {createStore} from './helpers';
import {middlewares, procedures, channels} from './symbols';

const channel1 = (publish: (payload: number) => void) => publish(0);
const channel2 = (publish: (payload: string) => void) => publish('');

type PayloadFromChannel<CL> = CL extends ChannelListener<infer P> ? P : never;

type ChannelsInfo = {
    channel1: PayloadFromChannel<typeof channel1>;
    channel2: PayloadFromChannel<typeof channel2>;
};

function createFakeServer() {
    return {
        [middlewares]: void 0,
        [procedures]: void 0,
        [channels]: createStore({})
    } as any as ApiServer<any, ChannelsInfo>;
}

test('mountChannel return given ApiServer instance', () => {
    const server = createFakeServer();
    expect(mountChannel<ChannelsInfo, 'channel1'>(server, 'channel1', channel1)).toBe(server);
});

test('mountChannel support FP-style call', () => {
    const server = createFakeServer();
    const binder = mountChannel<ChannelsInfo, 'channel1'>('channel1', channel1);
    expect(typeof binder).toBe('function');
    expect(binder(server)).toBe(server);
});

test('mountChannel throws error when mount the some channel name to the some server twice', () => {
    const server = createFakeServer();
    mountChannel<ChannelsInfo, 'channel1'>(server, 'channel1', channel1);
    expect(() => (
        mountChannel<ChannelsInfo, 'channel1'>(server, 'channel1', _ => void _)
    )).toThrow('Cannot mount channel "channel1" to the some server twice');
});

test('mountChannel add listener to channels store as the some name', () => {
    const server = createFakeServer();
    const channelsStore = server[channels];

    mountChannel<ChannelsInfo, 'channel1'>(server, 'channel1', channel1);
    expect(channelsStore()).toHaveProperty('channel1', channel1);
    expect(channelsStore()).not.toHaveProperty('channel2');

    mountChannel<ChannelsInfo, 'channel2'>(server, 'channel2', channel2);
    expect(channelsStore()).toHaveProperty('channel1', channel1);
    expect(channelsStore()).toHaveProperty('channel2', channel2);
});