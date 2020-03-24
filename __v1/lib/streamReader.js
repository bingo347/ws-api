'use strict';

const {Readable} = require('stream');

function streamReader(stream, chunkSize, onCunk) {
    stream.on('readable', () => {
        const chunk = stream.read(chunkSize);
        if(chunk) {
            onCunk(chunk);
            setTimeout(() => stream.emit('readable'), 0);
        }
    });
    stream.on('end', () => onCunk(null));
}

function checkStream(stream) {
    if(!(stream instanceof Readable)) {
        throw new TypeError('Upload must be a stream.Readable');
    }
}

streamReader.check = checkStream;
module.exports = streamReader;
