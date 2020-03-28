export type ProceduresBase = Record<string, [unknown, unknown]>;
export type ChannelsBase = Record<string, unknown>;

export const CLIENT_CALL         = 1;
export const CLIENT_UPLOAD       = 2;
export const CLIENT_SUBSCRIBE    = 3;
export const CLIENT_UNSUBSCRIBE  = 4;
export const SERVER_RESOLVE      = 100;
export const SERVER_REJECT       = 101;
export const SERVER_PUBLISH      = 102;
export const ANY_MESSAGE         = 200;
export const ANY_PING            = 201;
export const ANY_PONG            = 202;

export type T_CLIENT_CALL         = typeof CLIENT_CALL;
export type T_CLIENT_UPLOAD       = typeof CLIENT_UPLOAD;
export type T_CLIENT_SUBSCRIBE    = typeof CLIENT_SUBSCRIBE;
export type T_CLIENT_UNSUBSCRIBE  = typeof CLIENT_UNSUBSCRIBE;
export type T_SERVER_RESOLVE      = typeof SERVER_RESOLVE;
export type T_SERVER_REJECT       = typeof SERVER_REJECT;
export type T_SERVER_PUBLISH      = typeof SERVER_PUBLISH;
export type T_ANY_MESSAGE         = typeof ANY_MESSAGE;
export type T_ANY_PING            = typeof ANY_PING;
export type T_ANY_PONG            = typeof ANY_PONG;

export type T_CLIENT = T_CLIENT_CALL | T_CLIENT_UPLOAD | T_CLIENT_SUBSCRIBE | T_CLIENT_UNSUBSCRIBE;
export type T_SERVER = T_SERVER_RESOLVE | T_SERVER_REJECT | T_SERVER_PUBLISH;
export type T_ANY = T_ANY_MESSAGE | T_ANY_PING | T_ANY_PONG;
export type T_CLIENT_ANY = T_CLIENT | T_ANY;
export type T_SERVER_ANY = T_SERVER | T_ANY;

const tag = Symbol();
type Communication1 = {
    [tag]: T_CLIENT_CALL;
    id: number;
    procedure: string;
    payload: unknown;
    hasUpload: boolean;
};
type Communication2 = {
    [tag]: T_CLIENT_UPLOAD;
    id: number;
    chunk: Uint8Array;
};
type Communication3 = {
    [tag]: T_CLIENT_SUBSCRIBE | T_CLIENT_UNSUBSCRIBE;
    channel: string;
};
type Communication4 = {
    [tag]: T_SERVER_RESOLVE | T_SERVER_REJECT;
    id: number;
    result: unknown;
};
type Communication5 = {
    [tag]: T_SERVER_PUBLISH;
    channel: string;
    payload: unknown;
};
type Communication6 = {
    [tag]: T_ANY_MESSAGE;
    payload: unknown;
};
type Communication7 = {
    [tag]: T_ANY_PING | T_ANY_PONG;
}
export type Communication =
    | Communication1
    | Communication2
    | Communication3
    | Communication4
    | Communication5
    | Communication6
    | Communication7;

export function isCommunication(v: unknown): v is Communication {
    return typeof v === 'object' && v !== null && typeof (v as any)[tag] === 'number';
}

/* eslint-disable no-shadow */
export function createCommunication(
    tag: T_CLIENT_CALL,
    id: Communication1['id'],
    procedure: Communication1['procedure'],
    payload: Communication1['payload'],
    hasUpload?: Communication1['hasUpload']
): Communication1;
export function createCommunication(
    tag: T_CLIENT_UPLOAD,
    id: Communication2['id'],
    chunk: Communication2['chunk']
): Communication2;
export function createCommunication(
    tag: T_CLIENT_SUBSCRIBE | T_CLIENT_UNSUBSCRIBE,
    channel: Communication3['channel']
): Communication3;
export function createCommunication(
    tag: T_SERVER_RESOLVE | T_SERVER_REJECT,
    result: Communication4['result']
): Communication4;
export function createCommunication(
    tag: T_SERVER_PUBLISH,
    channel: Communication5['channel'],
    payload: Communication5['payload']
): Communication5;
export function createCommunication(
    tag: T_ANY_MESSAGE,
    payload: Communication6['payload']
): Communication6;
export function createCommunication(
    tag: T_ANY_PING | T_ANY_PONG
): Communication7;
/* eslint-enable no-shadow */
// eslint-disable-next-line max-lines-per-function
export function createCommunication(vtag: T_CLIENT_ANY | T_SERVER_ANY, ...args: any[]): Communication {
    switch(vtag) {
    case CLIENT_CALL: {
        const [id, procedure, payload, hasUpload = false] = args as [number, string, unknown, boolean?];
        return {[tag]: vtag, id, procedure, payload, hasUpload};
    }
    case CLIENT_UPLOAD: {
        const [id, chunk] = args as [number, Uint8Array];
        return {[tag]: vtag, id, chunk};
    }
    case CLIENT_SUBSCRIBE:
    case CLIENT_UNSUBSCRIBE: {
        const [channel] = args as [string];
        return {[tag]: vtag, channel};
    }
    case SERVER_RESOLVE:
    case SERVER_REJECT: {
        const [id, result] = args as [number, unknown];
        return {[tag]: vtag, id, result};
    }
    case SERVER_PUBLISH: {
        const [channel, payload] = args as [string, unknown];
        return {[tag]: vtag, channel, payload};
    }
    case ANY_MESSAGE: {
        const [payload] = args as [unknown];
        return {[tag]: vtag, payload};
    }
    }
    return {[tag]: vtag};
}

// eslint-disable-next-line max-lines-per-function
export function packCommunication(communication: Communication): [T_CLIENT_ANY | T_SERVER_ANY, ...any[]] {
    const vtag = communication[tag];
    switch(vtag) {
    case CLIENT_CALL: {
        const c = communication as Communication1;
        return [vtag, c.id, c.procedure, c.payload, c.hasUpload];
    }
    case CLIENT_UPLOAD: {
        const c = communication as Communication2;
        return [vtag, c.id, c.chunk];
    }
    case CLIENT_SUBSCRIBE:
    case CLIENT_UNSUBSCRIBE: {
        const c = communication as Communication3;
        return [vtag, c.channel];
    }
    case SERVER_RESOLVE:
    case SERVER_REJECT: {
        const c = communication as Communication4;
        return [vtag, c.id, c.result];
    }
    case SERVER_PUBLISH: {
        const c = communication as Communication5;
        return [vtag, c.channel, c.payload];
    }
    case ANY_MESSAGE: {
        const c = communication as Communication6;
        return [vtag, c.payload];
    }
    }
    return [vtag];
}