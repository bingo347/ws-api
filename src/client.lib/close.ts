import {Emit} from './handle';
import {EVENT_CLOSE} from './events';

export type CloseFn = (code: number, reason: string) => void;

export function closeFromSocket(socket: WebSocket): CloseFn {
    return (code, reason) => socket.close(code, reason);
}

export function closeFromEmit(emit: Emit<{[EVENT_CLOSE]: CloseFn}>): CloseFn {
    return (code, reason) => emit(EVENT_CLOSE, code, reason);
}