import {Readable as NodeReadableStream} from 'stream';
import {ProceduresBase} from '../shared/communications';
import {ApiServerContext} from './context';
import {ApiServer} from './apiServer';
import {normalizeArgs} from './helpers';
import {procedures} from './symbols';

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
>(...args: [Server, ProcedureName, Procedures<ProceduresInfo>[ProcedureName]] | [ProcedureName, Procedures<ProceduresInfo>[ProcedureName]]): Server | ((server: Server) => Server) {
    const [server, procedureName, procedure] = normalizeArgs(args);
    const bindProcedure = createProcedureBinder<ProceduresInfo, ProcedureName, Server>(procedureName, procedure);
    return server ? bindProcedure(server) : bindProcedure;
}

function createProcedureBinder<
    ProceduresInfo extends ProceduresBase,
    ProcedureName extends keyof ProceduresInfo,
    Server extends ApiServer<Procedures<ProceduresInfo>, any>
>(procedureName: ProcedureName, procedure: Procedures<ProceduresInfo>[ProcedureName]) {
    return (server: Server) => {
        if(procedureName in server[procedures]()) {
            // eslint-disable-next-line fp/no-throw
            throw new Error(`Cannot mount procedure "${procedureName}" to the some server twice`);
        }
        server[procedures](prevProcedures => ({
            ...prevProcedures,
            [procedureName]: procedure
        }));
        return server;
    };
}