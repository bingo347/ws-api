import {IncomingMessage} from 'http';

export type ApiServerContext = {
    socket: WebSocket;
    request: IncomingMessage;
    close(code: number, reason: string): void;
    // TODO:
    session: {};
};