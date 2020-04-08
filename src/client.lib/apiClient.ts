import {PatchedExtensionCodec, defaultExtensionCodec, createEncoder, createDecoder} from '../shared/msgpack';
import {Encoder} from '../shared/msgpack-extensions';
import {ProceduresBase, ChannelsBase} from '../shared/communications';
import {Handle, Emit, createHandle} from './handle';
import {OutEvents, InEvents, createConnection} from './connection';
import {CloseFn, closeFromEmit} from './close';
import {createReciever} from './reciever';
import {
    EVENT_SEND,
    EVENT_CLOSE,
    EVENT_ERROR
} from './events';
import {Call, Subscribe, Sender, PublicEvents, runClient} from './clientRunner';

export type ApiClientOptions = {
    extensionCodec?: PatchedExtensionCodec;
};
export type ApiClient<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
> = {
    send(payload: unknown): void;
    call: Call<ProceduresInfo>;
    subscribe: Subscribe<ChannelsInfo>;
    handle: Handle<PublicEvents>;
    close: CloseFn;
};

export function connect<
    ProceduresInfo extends ProceduresBase,
    ChannelsInfo extends ChannelsBase
>(url: string, options: ApiClientOptions = {}): ApiClient<ProceduresInfo, ChannelsInfo> {
    const extensionCodec = extractExtensionCodec(options);
    const [handleSocket, emitToSocket] = createConnection(normalizeURL(url));
    const sender = createSender(emitToSocket, createEncoder(extensionCodec));
    const reciever = createReciever(handleSocket, createDecoder(extensionCodec));
    const publicHandle = createPublicHandle(handleSocket);
    return runClient(sender, reciever, publicHandle, closeFromEmit(emitToSocket));
}

function createPublicHandle(handleSocket: Handle<OutEvents>): Handle<PublicEvents> {
    const [handle, emit] = createHandle<PublicEvents>();
    handleSocket(EVENT_CLOSE, closeFromEmit(emit));
    handleSocket(EVENT_ERROR, () => emit(EVENT_ERROR));
    return handle;
}

function createSender(emitToSocket: Emit<InEvents>, encode: Encoder): Sender {
    return data => emitToSocket(EVENT_SEND, encode(data));
}

function extractExtensionCodec(options: ApiClientOptions): PatchedExtensionCodec {
    return (options.extensionCodec instanceof PatchedExtensionCodec
        ? options.extensionCodec
        : defaultExtensionCodec
    );
}

function normalizeURL(url: string): string {
    const [firstChar, secondChar] = url;
    return (firstChar !== '/'
        ? url
        : (secondChar === '/'
            ? `${getProtocol()}${url}`
            : `${getProtocol()}//${location.host}${url}`
        )
    );
}

function getProtocol() {
    return location.protocol === 'http:' ? 'ws:' : 'wss:';
}