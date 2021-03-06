'use strict';

const {Readable} = require('stream');
const {EventEmitter} = require('events');
const {Server: WSServer} = require('ws');
const msgpack = require('msgpack-lite');
const checkType = require('./checkType.js');
const {
    TYPES: {T_REQUEST, T_UPLOAD, T_SUBSCRIBE, T_UNSUBSCRIBE, T_RESOLVE, T_REJECT, T_PUBLISH, T_MESSAGE, T_PING, T_PONG}
} = require('./constants.js');

const INIT_MIDDLEWARES = Symbol('init middlewares');
const API_METHODS = Symbol('api methods');
const CHAN_METHODS = Symbol('channel methods');
const UPLOAD_CHUNKS = Symbol('upload chunks');
const UNSUBSCRIBE_FNS = Symbol('unsubscribe functions');
const WAIT_PONG = Symbol('wait pong');

const msgTypesFn = {
    [T_REQUEST](ctx, {
        id,
        an: apiName,
        p: payload,
        u: hasUpload
    }) {
        const fn = this[API_METHODS][apiName];
        if(!fn) {
            send(ctx.socket, {
                id,
                t: T_REJECT,
                r: new Error('Unknown api method ' + apiName)
            });
            return;
        }
        const uploadStream = hasUpload ? createUploadStream(id, ctx) : void 0;
        Promise.resolve()
            .then(() => fn.call(ctx, payload, uploadStream, ctx))
            .then(r => send(ctx.socket, {
                id,
                t: T_RESOLVE,
                r
            }))
            .catch(r => send(ctx.socket, {
                id,
                t: T_REJECT,
                r
            }));
    },
    [T_UPLOAD](ctx, {id, c: chunk}) {
        const chunksList = ctx[UPLOAD_CHUNKS][id];
        if(!chunksList) { return; }
        const payload = {
            chunk,
            next: chunksList.first
        };
        chunksList.first = payload;
        if(chunksList.last === null) {
            chunksList.last = payload;
        }
        if(chunk === null) {
            delete ctx[UPLOAD_CHUNKS][id];
        }
        if(chunksList.onReady) {
            chunksList.onReady();
        }
    },
    [T_SUBSCRIBE](ctx, {c: channel}) {
        const fn = this[CHAN_METHODS][channel];
        if(!fn) { return; }
        function publish(payload) {
            send(ctx.socket, {
                t: T_PUBLISH,
                c: channel,
                p: payload
            });
        }
        try {
            const unsubscribe = fn.call(ctx, publish, ctx);
            ctx[UNSUBSCRIBE_FNS][channel] = unsubscribe;
        } catch(e) {
            this.emit('error', e);
        }
    },
    [T_UNSUBSCRIBE](ctx, {c: channel}) {
        const fn = ctx[UNSUBSCRIBE_FNS][channel];
        delete ctx[UNSUBSCRIBE_FNS][channel];
        if(typeof fn !== 'function') { return; }
        try {
            fn.call(ctx, ctx);
        } catch(e) {
            this.emit('error', e);
        }
    },
    [T_MESSAGE](ctx, {p: payload}) {
        ctx.emit('message', payload);
    },
    [T_PONG](ctx) {
        if(!ctx[WAIT_PONG]) { return; }
        const {t, resolve} = ctx[WAIT_PONG];
        clearTimeout(t);
        resolve(true);
    }
};

class ApiServer extends EventEmitter {
    constructor(options) {
        super();
        this[INIT_MIDDLEWARES] = [];
        this[API_METHODS] = {};
        this[CHAN_METHODS] = {};
        if(options && options.server instanceof WSServer) {
            this._server = options.server;
        } else {
            this._server = new WSServer(options);
        }
        this._server.on('error', (...args) => this.emit('error', ...args));
        this._server.on('listening', (...args) => this.emit('listening', ...args));
        this._server.on('headers', (...args) => this.emit('headers', ...args));
        this._server.on('connection', async (socket, request) => {
            const ctx = Object.assign(new EventEmitter(), {
                socket,
                request,
                session: {},
                closeCode: void 0,
                closeReason: void 0,
                [UPLOAD_CHUNKS]: {},
                [UNSUBSCRIBE_FNS]: {},
                [WAIT_PONG]: null,
                get openedChannels() {
                    return Object.getOwnPropertyNames(this[UNSUBSCRIBE_FNS]);
                },
                send(payload) {
                    send(socket, {
                        t: T_MESSAGE,
                        p: payload
                    });
                    return this;
                },
                ping(timeout = -1) {
                    if(this[WAIT_PONG]) {
                        clearTimeout(this[WAIT_PONG].t);
                        this[WAIT_PONG].resolve(false);
                    }
                    return new Promise((resolve, reject) => {
                        const r = this[WAIT_PONG] = {
                            resolve,
                            t: null
                        };
                        send(this.socket, {t: T_PING});
                        if(timeout >= 0) {
                            r.t = setTimeout(() => {
                                this[WAIT_PONG] = null;
                                reject(new Error('pong timeout'));
                            }, timeout);
                        }
                    });
                },
                close(code = ctx.closeCode, reason = ctx.closeReason) {
                    return socket.close(code, reason);
                }
            });
            var ready = false;
            socket.on('message', async (data) => {
                const payload = msgpack.decode(data);
                while(!ready) {
                    await delay();
                }
                const fn = msgTypesFn[payload.t];
                if(!fn) { return; }
                fn.call(this, ctx, payload);
            });
            socket.on('close', async (code, reason) => {
                while(!ready) {
                    await delay();
                }
                ctx.closeCode = code;
                ctx.closeReason = reason;
                for(let c of ctx.openedChannels) {
                    msgTypesFn[T_UNSUBSCRIBE](ctx, {c});
                }
                ctx.emit('close', code, reason, ctx);
            });
            for(let fn of this[INIT_MIDDLEWARES]) {
                try {
                    await fn.call(ctx, ctx);
                } catch(e) {
                    this.emit('error', e);
                }
            }
            ready = true;
        });
    }

    get apiMethods() {
        return Object.getOwnPropertyNames(this[API_METHODS]);
    }

    get channels() {
        return Object.getOwnPropertyNames(this[CHAN_METHODS]);
    }

    use(_fn) {
        const fn = _fn && typeof _fn.install === 'function' ? _fn.install(this) : _fn;
        checkType(fn, 'function', 'Middleware');
        this[INIT_MIDDLEWARES].push(fn);
        return this;
    }

    mount(prefix, fns) {
        setFns(prefix, fns, this[API_METHODS], 'Api');
        return this;
    }

    channel(prefix, fns) {
        setFns(prefix, fns, this[CHAN_METHODS], 'Channel');
        return this;
    }

    close(cb) {
        this._server.close(cb);
    }
}

module.exports = ApiServer;

function delay(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setFns(prefix, fns, target, type) {
    var $prefix, $fns;
    if(typeof prefix === 'object') {
        $prefix = '';
        $fns = prefix;
    } else {
        $prefix = prefix;
        $fns = fns;
    }
    checkType($prefix, 'string', type + ' name prefix');
    if(typeof $fns === 'function') {
        target[$prefix] = $fns;
        return;
    }
    checkType($fns, 'object', type + ' methods');
    const props = Object.getOwnPropertyNames($fns);
    for(let prop of props) {
        let fn = $fns[prop];
        if(typeof fn === 'function') {
            target[$prefix + prop] = fn;
        }
    }
}

function send(socket, payload) {
    const data = msgpack.encode(payload);
    socket.send(data);
}

function createUploadStream(id, ctx) {
    const chunksList = ctx[UPLOAD_CHUNKS][id] = {
        onReady: null,
        first: null,
        last: null
    };
    return new Readable({
        async read() {
            if(chunksList.first === null) {
                await new Promise(onReady => {
                    chunksList.onReady = onReady;
                });
                chunksList.onReady = null;
            }
            const payload = chunksList.first;
            chunksList.first = payload.next;
            if(!payload.next) {
                chunksList.last = null;
            }
            this.push(payload.chunk);
        }
    });
}
