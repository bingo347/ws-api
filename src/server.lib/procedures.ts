import {Readable as NodeReadableStream} from 'stream';
import {ProceduresBase} from '../shared/communications';
import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';

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
    ProcedureName extends keyof ProceduresInfo,
    Server extends ApiServer<Procedures<ProceduresInfo>, any> = ApiServer<Procedures<ProceduresInfo>, any>
>(server: Server, procedureName: ProcedureName, procedure: Procedures<ProceduresInfo>[ProcedureName]): Server;
export function mountProcedure<
    ProceduresInfo extends ProceduresBase,
    ProcedureName extends keyof ProceduresInfo,
    Server extends ApiServer<Procedures<ProceduresInfo>, any> = ApiServer<Procedures<ProceduresInfo>, any>
>(procedureName: ProcedureName, procedure: Procedures<ProceduresInfo>[ProcedureName]): (server: Server) => Server;
export function mountProcedure<
    ProceduresInfo extends ProceduresBase,
    ProcedureName extends keyof ProceduresInfo,
    Server extends ApiServer<Procedures<ProceduresInfo>, any> = ApiServer<Procedures<ProceduresInfo>, any>
>(...args: [Server | ProcedureName, ProcedureName | Procedures<ProceduresInfo>[ProcedureName], Procedures<ProceduresInfo>[ProcedureName]?]): Server | ((server: Server) => Server) {
    // TODO:
    return void args as any as Server;
}
