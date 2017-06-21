'use strict';

module.exports = function api(url) {
    if(typeof url !== 'string') {
        throw new TypeError('First argument must be string');
    }
};
