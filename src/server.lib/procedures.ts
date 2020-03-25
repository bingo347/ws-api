import {Readable as NodeReadableStream} from 'stream';
import {ProceduresBase} from '../shared/communications';
import {ApiServerContext} from './context';

type ApiServer<P, C> = {p: P; c: C};

export type Procedure<Payload, Result> = (
    this: ApiServerContext,
    payload: Payload,
    uploadStream: NodeReadableStream | null,
    context: ApiServerContext
) => Result | Promise<Result>;

export type Procedures<ProceduresInfo extends ProceduresBase> = {
    [K in keyof ProceduresInfo]: Procedure<ProceduresInfo[K][0], ProceduresInfo[K][1]>;
};

export function mountProcedure<
    ProceduresInfo extends ProceduresBase,
    Server extends ApiServer<Procedures<ProceduresInfo>, unknown>,
    ProcedureName extends keyof ProceduresInfo
>(server: Server, procedureName: ProcedureName, procedure: Procedures<ProceduresInfo>[ProcedureName]): Server;
export function mountProcedure<
    ProceduresInfo extends ProceduresBase,
    Server extends ApiServer<Procedures<ProceduresInfo>, unknown>,
    ProcedureName extends keyof ProceduresInfo
>(procedureName: ProcedureName, procedure: Procedures<ProceduresInfo>[ProcedureName]): (server: Server) => Server;
export function mountProcedure<
    ProceduresInfo extends ProceduresBase,
    Server extends ApiServer<Procedures<ProceduresInfo>, unknown>,
    ProcedureName extends keyof ProceduresInfo
>(...args: [Server | ProcedureName, ProcedureName | Procedures<ProceduresInfo>[ProcedureName], Procedures<ProceduresInfo>[ProcedureName]?]): Server | ((server: Server) => Server) {
    // TODO:
    return void args as any as Server;
}
