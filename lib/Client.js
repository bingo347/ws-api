'use strict';

const msgpack = require('msgpack-lite');

module.exports = function(reader, EventEmitter) {
    class Client extends EventEmitter {
        constructor() {
            super();
            Object.defineProperties(this, {
                '@emit': createDescriptor(this.emit),
                '#queue': createDescriptor([]),
                '#socket': createDescriptor(null)
            });
            this.emit = void 0;
        }

        request(apiName, payload, upload) {

        }

        subscribe(chanel, cb) {

        }

        unsubscribe(chanel, cb) {

        }

        ['@connect']() {
            Object.defineProperty(this, '#socket', createDescriptor(null));
        }

        ['@open'](socket) {
            const queue = this['#queue'];
            Object.defineProperties(this, {
                '#queue': createDescriptor([]),
                '#socket': createDescriptor(socket)
            });
            for(let i = 0; i < queue.length; i++) {
                this['#socket'].send(queue[i]);
            }
        }

        ['@send'](payload) {
            const data = msgpack.encode(payload);
            if(this['#socket']) {
                this['#socket'].send(data);
            } else {
                this['#queue'].push(data);
            }
        }

        ['@message'](data) {
            const payload = msgpack.decode(data);
        }

        ['@error'](err) {
            this['@emit']('error', err);
        }

        ['@close'](code, reason) {
            this['@emit']('close', code, reason);
        }
    }

    return Client;
};

function createDescriptor(value) {
    return {
        configurable: true,
        writable: false,
        enumerable: false,
        value
    };
}
