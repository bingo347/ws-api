'use strict';

const WebSocket = require('ws');
const checkType = require('./checkType.js');
const streamReader = require('./streamReader.js');
const Client = require('./Client.js')(streamReader);
const {
    CLIENT_METHODS: {M_CONNECT, M_OPEN, M_MESSAGE, M_ERROR, M_CLOSE}
} = require('./constants.js');

module.exports = function api(url, options = {}) {
    checkType(url, 'string', 'First argument');
    const client = new Client(options);
    void function connect() {
        client[M_CONNECT]();
        const socket = new WebSocket(url);
        socket.on('message', data => client[M_MESSAGE](data));
        socket.on('open', () => {
            client[M_OPEN]({
                send(data) {
                    socket.send(data);
                },
                close(code, reason) {
                    socket.close(code, reason);
                }
            });
        });
        socket.on('error', err => {
            socket.terminate();
            connect();
            client[M_ERROR](err);
        });
        socket.on('close', (code, reason) => {
            if(code === 1000) {
                client[M_CLOSE](code, reason);
                return;
            }
            socket.terminate();
            connect();
        });
    }();
    return client;
};
