/* eslint-env browser */
'use strict';

function blobReader(blob, chunkSize, onCunk) {
    const chunks = [];
    for(let i = 0; i < blob.size; i += chunkSize) {
        chunks.push(blob.slice(i, Math.min(blob.size, i + chunkSize)));
    }
    const fr = new FileReader();
    var curChank = 0;
    function next() {
        if(curChank >= chunks.length) {
            onCunk(null);
            return;
        }
        fr.readAsArrayBuffer(chunks[curChank]);
    }
    fr.onloadend = () => {
        curChank++;
        onCunk(new Uint8Array(fr.result));
        setTimeout(next, 0);
    };
    setTimeout(next, 0);
}

module.exports = blobReader;
