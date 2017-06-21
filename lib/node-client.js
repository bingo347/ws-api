'use strict';

module.exports = function api(_url = '/') {
    if(typeof _url !== 'string') {
        throw new TypeError('First argument must be string');
    }
};
