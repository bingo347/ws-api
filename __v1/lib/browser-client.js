/* eslint-env browser */
'use strict';

const checkType = require('./checkType.js');
const blobReader = require('./browser/blobReader.js');
const Client = require('./Client.js')(blobReader);
const {
    CLIENT_METHODS: {M_CONNECT, M_OPEN, M_MESSAGE, M_ERROR, M_CLOSE}
} = require('./constants.js');


function api(_url = '/', options = {}) {
    checkType(_url, 'string', 'First argument');
    const url = normalizeURL(_url);
    const client = new Client(options);
    void function connect() {
        client[M_CONNECT]();
        const socket = new WebSocket(url);
        socket.binaryType = 'arraybuffer';
        socket.onmessage = event => client[M_MESSAGE](new Uint8Array(event.data));
        socket.onopen = () => {
            socket.onopen = null;
            client[M_OPEN]({
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
            connect();
            client[M_ERROR](err);
        };
        socket.onclose = event => {
            if(event.wasClean) {
                client[M_CLOSE](event.code, event.reason);
                return;
            }
            connect();
        };
    }();
    return client;
}

module.exports = api;

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
