export type ProceduresBase = Record<string, [unknown, unknown]>;
export type ChannelsBase = Record<string, unknown>;

export const CLIENT_CALL         = 1;
export const CLIENT_UPLOAD       = 2;
export const CLIENT_SUBSCRIBE    = 3;
export const CLIENT_UNSUBSCRIBE  = 4;
export const SERVER_RESOLVE      = 100;
export const SERVER_REJECT       = 101;
export const SERVER_PUBLISH      = 102;
export const MESSAGE             = 200;
export const PING                = 201;
export const PONG                = 202;

export type T_CLIENT_CALL         = typeof CLIENT_CALL;
export type T_CLIENT_UPLOAD       = typeof CLIENT_UPLOAD;
export type T_CLIENT_SUBSCRIBE    = typeof CLIENT_SUBSCRIBE;
export type T_CLIENT_UNSUBSCRIBE  = typeof CLIENT_UNSUBSCRIBE;
export type T_SERVER_RESOLVE      = typeof SERVER_RESOLVE;
export type T_SERVER_REJECT       = typeof SERVER_REJECT;
export type T_SERVER_PUBLISH      = typeof SERVER_PUBLISH;
export type T_MESSAGE             = typeof MESSAGE;
export type T_PING                = typeof PING;
export type T_PONG                = typeof PONG;

export type T_CLIENT = T_MESSAGE | T_PING | T_PONG | T_CLIENT_CALL | T_CLIENT_UPLOAD | T_CLIENT_SUBSCRIBE | T_CLIENT_UNSUBSCRIBE;
export type T_SERVER = T_MESSAGE | T_PING | T_PONG | T_SERVER_RESOLVE | T_SERVER_REJECT | T_SERVER_PUBLISH;

type WithTag<Tag extends T_CLIENT | T_SERVER> = {tag: Tag};
type WithID = {id: number};
type WithPayload = {payload: unknown};

export type ClientCallCommunication = WithTag<T_CLIENT_CALL> & WithID & WithPayload & {
    procedure: string;
    hasUpload: boolean;
};
export type ClientUploadCommunication = WithTag<T_CLIENT_UPLOAD> & WithID & {
    chunk: Uint8Array;
};
export type ClientSubscribeUnsubscribeCommunication = WithTag<T_CLIENT_SUBSCRIBE | T_CLIENT_UNSUBSCRIBE> & {
    channel: string;
};
export type ServerResolveRejectCommunication = WithTag<T_SERVER_RESOLVE | T_SERVER_REJECT> & WithID & {
    result: unknown;
};
export type ServerPublishCommunication = WithTag<T_SERVER_PUBLISH> & WithPayload & {
    channel: string;
};
export type MessageCommunication = WithTag<T_MESSAGE> & WithPayload;
export type PingPongCommunication = WithTag<T_PING | T_PONG>;

export type CommunicationByTag<Tag extends T_CLIENT | T_SERVER> = {
    [CLIENT_CALL]: ClientCallCommunication;
    [CLIENT_UPLOAD]: ClientUploadCommunication;
    [CLIENT_SUBSCRIBE]: ClientSubscribeUnsubscribeCommunication;
    [CLIENT_UNSUBSCRIBE]: ClientSubscribeUnsubscribeCommunication;
    [SERVER_RESOLVE]: ServerResolveRejectCommunication;
    [SERVER_REJECT]: ServerResolveRejectCommunication;
    [SERVER_PUBLISH]: ServerPublishCommunication;
    [MESSAGE]: MessageCommunication;
    [PING]: PingPongCommunication;
    [PONG]: PingPongCommunication;
}[Tag];
export type Communication = CommunicationByTag<T_CLIENT | T_SERVER>;

export function isCommunication(v: unknown): v is Communication {
    return typeof v === 'object' && v !== null && typeof (v as any).tag === 'number';
}

export function isPackedCommunication(v: unknown): v is [T_CLIENT | T_SERVER, ...any[]] {
    return Array.isArray(v) && (
        v[0] === MESSAGE
        || v[0] === PING
        || v[0] === PONG
        || v[0] === CLIENT_CALL
        || v[0] === CLIENT_UPLOAD
        || v[0] === CLIENT_SUBSCRIBE
        || v[0] === CLIENT_UNSUBSCRIBE
        || v[0] === SERVER_RESOLVE
        || v[0] === SERVER_REJECT
        || v[0] === SERVER_PUBLISH
    );
}

export function createCommunication(
    tag: T_CLIENT_CALL,
    id: ClientCallCommunication['id'],
    procedure: ClientCallCommunication['procedure'],
    payload: ClientCallCommunication['payload'],
    hasUpload?: ClientCallCommunication['hasUpload']
): ClientCallCommunication;
export function createCommunication(
    tag: T_CLIENT_UPLOAD,
    id: ClientUploadCommunication['id'],
    chunk: ClientUploadCommunication['chunk']
): ClientUploadCommunication;
export function createCommunication(
    tag: T_CLIENT_SUBSCRIBE | T_CLIENT_UNSUBSCRIBE,
    channel: ClientSubscribeUnsubscribeCommunication['channel']
): ClientSubscribeUnsubscribeCommunication;
export function createCommunication(
    tag: T_SERVER_RESOLVE | T_SERVER_REJECT,
    id: ServerResolveRejectCommunication['id'],
    result: ServerResolveRejectCommunication['result']
): ServerResolveRejectCommunication;
export function createCommunication(
    tag: T_SERVER_PUBLISH,
    channel: ServerPublishCommunication['channel'],
    payload: ServerPublishCommunication['payload']
): ServerPublishCommunication;
export function createCommunication(
    tag: T_MESSAGE,
    payload: MessageCommunication['payload']
): MessageCommunication;
export function createCommunication(
    tag: T_PING | T_PONG
): PingPongCommunication;

// eslint-disable-next-line max-lines-per-function
export function createCommunication(tag: T_CLIENT | T_SERVER, ...args: any[]): Communication {
    switch(tag) {
    case CLIENT_CALL: {
        const [id, procedure, payload, hasUpload = false] = args as [number, string, unknown, boolean?];
        return {tag, id, procedure, payload, hasUpload};
    }
    case CLIENT_UPLOAD: {
        const [id, chunk] = args as [number, Uint8Array];
        return {tag, id, chunk};
    }
    case CLIENT_SUBSCRIBE:
    case CLIENT_UNSUBSCRIBE: {
        const [channel] = args as [string];
        return {tag, channel};
    }
    case SERVER_RESOLVE:
    case SERVER_REJECT: {
        const [id, result] = args as [number, unknown];
        return {tag, id, result};
    }
    case SERVER_PUBLISH: {
        const [channel, payload] = args as [string, unknown];
        return {tag, channel, payload};
    }
    case MESSAGE: {
        const [payload] = args as [unknown];
        return {tag, payload};
    }
    }
    return {tag};
}

// eslint-disable-next-line max-lines-per-function
export function packCommunication(communication: Communication): [T_CLIENT | T_SERVER, ...any[]] {
    const {tag} = communication;
    switch(tag) {
    case CLIENT_CALL: {
        const c = communication as ClientCallCommunication;
        return [tag, c.id, c.procedure, c.payload, c.hasUpload];
    }
    case CLIENT_UPLOAD: {
        const c = communication as ClientUploadCommunication;
        return [tag, c.id, c.chunk];
    }
    case CLIENT_SUBSCRIBE:
    case CLIENT_UNSUBSCRIBE: {
        const c = communication as ClientSubscribeUnsubscribeCommunication;
        return [tag, c.channel];
    }
    case SERVER_RESOLVE:
    case SERVER_REJECT: {
        const c = communication as ServerResolveRejectCommunication;
        return [tag, c.id, c.result];
    }
    case SERVER_PUBLISH: {
        const c = communication as ServerPublishCommunication;
        return [tag, c.channel, c.payload];
    }
    case MESSAGE: {
        const c = communication as MessageCommunication;
        return [tag, c.payload];
    }
    }
    return [tag];
}

// eslint-disable-next-line max-lines-per-function
export function unpackCommunication(data: [T_CLIENT | T_SERVER, ...any[]]): void | Communication {
    const [tag, d1, d2] = data;
    switch(tag) {
    case CLIENT_CALL:
        if(typeof d1 === 'number' && typeof d2 === 'string') {
            return createCommunication(tag, d1, d2, data[3], !!data[4]);
        }
        break;
    case CLIENT_UPLOAD:
        if(typeof d1 === 'number' && d2 instanceof Uint8Array) {
            return createCommunication(tag, d1, d2);
        }
        break;
    case CLIENT_SUBSCRIBE:
    case CLIENT_UNSUBSCRIBE:
        if(typeof d1 === 'string') {
            return createCommunication(tag, d1);
        }
        break;
    case SERVER_RESOLVE:
    case SERVER_REJECT:
        if(typeof d1 === 'number') {
            return createCommunication(tag, d1, data[2]);
        }
        break;
    case SERVER_PUBLISH:
        if(typeof d1 === 'string') {
            return createCommunication(tag, d1, d2);
        }
        break;
    case MESSAGE:
        return createCommunication(tag, d1);
    case PING:
    case PONG:
        return createCommunication(tag);
    }
    return void 0;
}