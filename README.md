# WS-API

Server and client library for implementing RPC & PubSub api on top of the websocket

## Warning

Version 2 is in the alpha stage and may have bugs. \
If you need a stable version, install version 1. \
I'll be glad to take your issues & pull requests.

## Install

```bash
npm install --save ws-api@alpha
# or
yarn add ws-api@alpha
```

## What's new in version 2

- Rewritten to TypeScript and has better types
- Server library redesigned for write reusable & testable api
- Client library redesigned for small size & better tree shaking
- Changed msgpack dependency
- (TODO) Internal node client without network use for testing & SSR
- Not supported file uploads (it has bug), but I restore it later

## Usage examples

```typescript
// types.ts
// types must be shared between client & server

export type Procedures = {
    // procedureName: [PayloadType, ResultType];
    testResolve: [number, string];
    testReject: [void, void]
};

export type Channels = {
    // channelName: PayloadType
    counterChannel: number;
};
```

```typescript
// server.ts
import {createServer, useMiddleware, mountProcedure, mountChannel} from 'ws-api/server';
import {Procedures, Channels} from './types.ts';

// you can declare any middleware, procedure or channel without server
// and attach it later
const middleware1 = useMiddleware(ctx => {
    ctx.handle('error', err => console.log(`Oops... ${err}`));
});
const middleware2 = useMiddleware(() => {
    // if middleware return Promise
    // next middleware and all communications wait it
    return new Promise(resolve => setTimeout(resolve, 500));
});

// create server on port 3000
const server = createServer<Procedures, Channels>({port: 3000});

// attach middleware to server:
middleware1(server);
middleware2(server);

// or attach middleware with creation:
useMiddleware(server, ctx => {
    // session is simple functor with object for your data:
    const {session} = ctx;
    // you can update session, with updater callback:
    session(oldData => ({...oldData, user: 'admin'}));
    // or get session value, if call without arguments:
    console.log(session().user);
});

// mount procedures:
mountProcedure(server, 'testResolve', payload => {
    // payload has type number by Procedures type ))
    // and you must return string or Promise<string> here
    return String(payload);
});
mountProcedure('testReject', () => {
    // you can throw Error for rejects client promise
    throw new Error('Oops');
})(server); // it's work too

// mount channel:
mountChannel(server, 'counterChannel', publish => {
    // callback called when client subscribe first time
    let counter = 0;
    const interval = setInterval(() = {
        counter++;
        // you can publish any time while channel subscribed
        // and counter must be number by Channels type
        publish(counter);
    }, 1000);
    // you can return function
    // it called when client unsubscribe last time
    return () => clearInterval(interval);
});
```

```typescript
// client.ts
import {connect} from 'ws-api/client';
import {Procedures, Channels} from './types.ts';

// url can detect protocol and select ws: or wss:
// url also can use page host if you start '/ws-api/url' format
const api = connect<Procedures, Channels>('//localhost:3000/');

api.call('testResolve', 10).then(s => {
    console.log(s); // s is '10' here
});
api.call('testReject').catch(err => {
    console.log(err); // Error: Oops
});

// all api methods is context free
const {subscribe, handle, close} = api;

// subscribe returns it's unsubscribe
const unsubscribe = subscribe('counterChannel', counter => {
    // logs next number every second (does your network work perfectly?)
    console.log(counter);
});
setTimeout(() = {
    // just call it for unsubscribe counterChannel
    unsubscribe();
}, 5000);

// handle events:
handle('close', (code, reason) => {
    console.log(`Socket closed with ${code} because ${reason}`);
});

// or close socket manually:
setTimeout(() => {
    const NORMAL_CLOSE_WS_CODE = 1000;
    close(NORMAL_CLOSE_WS_CODE, 'Manual close');
}, 10000);
```

## Api docs

### Client

```typescript
// all imported from ws-api/client

// create custom codec for msgpack
function createExtensionCodec(): ExtensionCodec

type ClientOptions = {
    // and pass it to optional options
    extensionCodec?: ExtensionCodec;
};
// it returned from connect:
type Client<Procedures extends ProceduresBase, Channels extends ChannelsBase> = {
    // send simple message (server can handle it as message)
    send(payload: unknown): void;

    // call remote procedure
    call<ProcedureName extends keyof Procedures>(procedureName: ProcedureName, payload: Procedures[ProcedureName][0]) => Promise<Procedures[ProcedureName][1]>;

    // subscribe remote channel
    subscribe: <ChannelName extends keyof Channels>(channelName: ChannelName, cb: (payload: Channels[ChannelName]) => void) => (() => void);

    // handle events
    handle('message', cb: (payload: unknown) => void): void;
    handle('close', cb: (code: number, reason: string) => void): void;
    handle('error', cb: () => void): void;

    // close connection
    close(code: number, reason: string): void;
};

// connect to server
function connect<Procedures extends ProceduresBase, Channels extends ChannelsBase>(url: string, options?: ClientOptions): Client<Procedures, Channels>;
```

### Server

```typescript
// all imported from ws-api/client

// create custom codec for msgpack
function createExtensionCodec(): ExtensionCodec

type ServerOptions = WebSocket.ServerOptions & {
    // and pass it to optional options
    extensionCodec?: ExtensionCodec;
    // you can use external server
    server?: WebSocket.Server | http.Server | https.Server;
};

// it returned from createServer
type Server<Procedures extends ProceduresBase, Channels extends ChannelsBase> = {
    // handle events
    handle(event: "error", cb: (err: Error) => void): () => void;
    handle(event: "close" | "listening", cb: () => void): () => void;
    handle(event: "headers", cb: (headers: string[], request: IncomingMessage) => void): () => void;

    // stop server
    close(): Promise<void>;
};

// create server & listen port
function createServer<Procedures extends ProceduresBase, Channels extends ChannelsBase>(options?: ServerOptions): Server<Procedures, Channels>;

// middleware
type Middleware = (this: ServerContext, context: ServerContext) => void | Promise<void>;

function useMiddleware<S extends Server<any, any>>(server: S, middleware: Middleware): S;

function useMiddleware<S extends Server<any, any>>(middleware: Middleware): (server: S) => S;

// procedures
type Procedure = <Payload, Result>(this: ServerContext, payload: Payload, uploadStream: null /* unused now */, context: ServerContext) => Result | Promise<Result>;

function mountProcedure<Procedures extends ProceduresBase, ProcedureName extends keyof Procedures, S extends Server<Procedures, any> = Server<Procedures, any>>(server: S, procedureName: ProcedureName, procedure: Procedure): S;

function mountProcedure<Procedures extends ProceduresBase, ProcedureName extends keyof Procedures, S extends Server<Procedures, any> = Server<Procedures, any>>(procedureName: ProcedureName, procedure: Procedure): (server: S) => S;


// channels
type ChannelListener = <Payload>(this: ServerContext, publish: (payload: Payload) => void, context: ServerContext) => void | (() => void);

function mountChannel<Channels extends ChannelsBase, ChannelName extends keyof Channels, S extends Server<any, Channels> = Server<any, Channels>>(server: S, channelName: ChannelName, channelListener: ChannelListener): S;

function mountChannel<Channels extends ChannelsBase, ChannelName extends keyof Channels, S extends Server<any, Channels> = Server<any, Channels>>(channelName: ChannelName, channelListener: ChannelListener): (server: S) => S;

// context in middleware/procedure/channel
type ServerContext = {
    socket: WebSocket;
    request: IncomingMessage;
    session: Store<Record<string | symbol, any>>;
    handle(event: 'message', cb: (payload: unknown) => void): () => void;
    handle(event: 'close', cb: (code: number, reason: string) => void): () => void;
    handle(event: 'error', cb: (err: Error) => void): () => void;
    ping(): Promise<void>;
    send(payload: unknown): void;
    close(code?: number, reason?: string): void;
};
```

## License

MIT
