'use strict';

const sym = function() {
    if(typeof Symbol === 'function') {
        return Symbol;
    }
    function randomString() {
        return Math.random().toString(36).slice(2);
    }
    const prefix = '@--' + randomString() + '--';
    return function sym(tag) {
        return prefix + (tag || randomString());
    };
}();

const CLIENT_METHODS = {
    M_EMIT: sym('emit'),
    M_CONNECT: sym('connect'),
    M_OPEN: sym('open'),
    M_SEND: sym('send'),
    M_MESSAGE: sym('message'),
    M_ERROR: sym('error'),
    M_CLOSE: sym('close'),
    M_CREATE_WAIT: sym('create wait')
};

const CLIENT_PROPS = {
    P_CONFIG: sym('config'),
    P_SOCKET: sym('socket'),
    P_QUEUE: sym('queue'),
    P_SUBSCRIBERS: sym('subscribers'),
    P_WAIT: sym('wait'),
    P_WAIT_ID: sym('wait id')
};

const TYPES = {
    T_REQUEST: 1,
    T_UPLOAD: 2,
    T_SUBSCRIBE: 3,
    T_UNSUBSCRIBE: 4,
    T_RESOLVE: 100,
    T_REJECT: 101,
    T_PUBLISH: 102
};

module.exports = {
    CLIENT_METHODS,
    CLIENT_PROPS,
    TYPES
};
