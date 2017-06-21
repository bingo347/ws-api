/* eslint-env browser */
'use strict';

const blobReader = require('./browser/blobReader.js');
const EventEmitter = require('./browser/EventEmitter.js');
const Client = require('./Client.js')(blobReader, EventEmitter);

module.exports = function api(_url = '/') {
    if(typeof _url !== 'string') {
        throw new TypeError('First argument must be string');
    }
    const url = normalizeURL(_url);
    const client = new Client();
    void function connect() {
        client['@connect']();
        const socket = new WebSocket(url);
        socket.binaryType = 'arraybuffer';
        socket.onmessage = event => client['@message'](new Uint8Array(event.data));
        socket.onopen = () => {
            socket.onopen = null;
            client['@open']({
                send(data) {
                    socket.send(data.buffer);
                },
                close(code, reason) {
                    socket.close(code, reason);
                }
            });
        };
        socket.onerror = err => {
            socket.onclose = null;
            socket.close();
            client['@error'](err);
            connect();
        };
        socket.onclose = event => {
            if(event.wasClean) {
                client['@close'](event.code, event.reason);
                return;
            }
            connect();
        };
    }();
    return client;
};

function normalizeURL(url) {
    const firstChar = url.charAt(0);
    const secondChar = url.charAt(1);
    if(firstChar !== '/') {
        return url;
    }
    const protocol = location.protocol === 'http:' ? 'ws:' : 'wss:';
    if(secondChar === '/') {
        return protocol + url;
    }
    return protocol + '//' + location.host + url;
}
