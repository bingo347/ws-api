'use strict';

function checkType(value, type, msg = '') {
    if(typeof value !== type) {
        throw new TypeError(`${msg} must be a ${type}`);
    }
}

module.exports = checkType;
