'use strict';

const {EventEmitter} = require('events');
const msgpack = require('msgpack-lite');
const checkType = require('./checkType.js');
const {
    CLIENT_METHODS: {M_EMIT, M_CONNECT, M_OPEN, M_SEND, M_MESSAGE, M_ERROR, M_CLOSE, M_CREATE_WAIT},
    CLIENT_PROPS: {P_CONFIG, P_SOCKET, P_QUEUE, P_SUBSCRIBERS, P_WAIT, P_WAIT_ID},
    TYPES: {T_REQUEST, T_UPLOAD, T_SUBSCRIBE, T_UNSUBSCRIBE, T_RESOLVE, T_REJECT, T_PUBLISH}
} = require('./constants.js');

const msgTypesFn = {
    [T_RESOLVE]({id, r: payload}) {
        const w = this[P_WAIT][id];
        if(!w) { return; }
        delete this[P_WAIT][id];
        w.resolve(payload);
    },
    [T_REJECT]({id, r: payload}) {
        const w = this[P_WAIT][id];
        if(!w) {
            this[M_EMIT]('error', payload);
            return;
        }
        delete this[P_WAIT][id];
        w.reject(payload);
    },
    [T_PUBLISH]({c: channel, p: payload}) {
        const fns = this[P_SUBSCRIBERS][channel];
        if(!fns || !fns.length) {
            this.unsubscribe(channel);
            return;
        }
        for(let i = fns.length; i--;) {
            try {
                fns[i].call(this, payload);
            } catch(e) {
                this[M_EMIT]('error', e);
            }
        }
    }
};

module.exports = function(reader) {
    class Client extends EventEmitter {
        constructor({
            uploadChunkSize = 262144
        }) {
            super();
            Object.defineProperties(this, {
                [M_EMIT]: createDescriptor(this.emit),
                [P_CONFIG]: createDescriptor({
                    uploadChunkSize
                }),
                [P_SOCKET]: createDescriptor([]),
                [P_QUEUE]: createDescriptor(null),
                [P_SUBSCRIBERS]: createDescriptor({}),
                [P_WAIT]: createDescriptor({}),
                [P_WAIT_ID]: createDescriptor(0, true)
            });
            this.emit = void 0;
        }

        request(apiName, payload, upload) {
            checkType(apiName, 'string', 'Api name');
            if(upload) { reader.check(upload); }
            const {id, promise} = this[M_CREATE_WAIT]();
            this[M_SEND]({
                id,
                t: T_REQUEST,
                an: apiName,
                p: payload,
                u: !!upload
            });
            if(upload) {
                reader(upload, this[P_CONFIG].uploadChunkSize, chunk => {
                    this[M_SEND]({
                        id,
                        t: T_UPLOAD,
                        c: chunk
                    });
                });
            }
            return promise;
        }

        subscribe(channel, cb) {
            checkType(channel, 'string', 'Channel name');
            checkType(cb, 'function', 'Subscribe listener');
            if(!this[P_SUBSCRIBERS][channel]) {
                this[P_SUBSCRIBERS][channel] = [cb];
                this[M_SEND]({
                    t: T_SUBSCRIBE,
                    c: channel
                });
                return;
            }
            this[P_SUBSCRIBERS][channel].push(cb);
            return this;
        }

        unsubscribe(channel, cb) {
            const subscribers = this[P_SUBSCRIBERS][channel];
            if(!subscribers) { return; }
            if(!cb || (subscribers.length === 1 && subscribers[0] === cb)) {
                delete this[P_SUBSCRIBERS][channel];
                this[M_SEND]({
                    t: T_UNSUBSCRIBE,
                    c: channel
                });
                return;
            }
            const index = subscribers.indexOf(cb);
            if(index === -1) { return; }
            subscribers.splice(index, 1);
            return this;
        }

        [M_CONNECT]() {
            Object.defineProperty(this, P_SOCKET, createDescriptor(null));
        }

        [M_OPEN](socket) {
            const queue = this[P_QUEUE];
            Object.defineProperties(this, {
                [P_QUEUE]: createDescriptor([]),
                [P_SOCKET]: createDescriptor(socket)
            });
            for(let i = 0; i < queue.length; i++) {
                this[P_SOCKET].send(queue[i]);
            }
        }

        [M_SEND](payload) {
            const data = msgpack.encode(payload);
            if(this[P_SOCKET]) {
                this[P_SOCKET].send(data);
            } else {
                this[P_QUEUE].push(data);
            }
        }

        [M_MESSAGE](data) {
            const payload = msgpack.decode(data);
            const fn = msgTypesFn[payload.t];
            if(!fn) { return; }
            fn.call(this, payload);
        }

        [M_ERROR](err) {
            this[M_EMIT]('error', err);
        }

        [M_CLOSE](code, reason) {
            this[M_EMIT]('close', code, reason);
        }

        [M_CREATE_WAIT]() {
            const id = this[P_WAIT_ID]++;
            return {
                id,
                promise: new Promise((resolve, reject) => {
                    this[P_WAIT][id] = {resolve, reject};
                })
            };
        }
    }

    return Client;
};

function createDescriptor(value, writable = false) {
    return {
        configurable: true,
        enumerable: false,
        writable,
        value
    };
}
