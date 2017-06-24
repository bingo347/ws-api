'use strict';

const fs = require('fs');
const cp = require('child_process');
const {Server} = require('..');

const api = new Server({port: 3000});

api.useOnInit(() => {
    console.log('new session');
});

api.useOnDestroy(() => {
    console.log('destroy session');
});

api.channel('session', (publish, ctx) => {
    console.log('subscribe');
    const t = setInterval(() => {
        publish(ctx.session);
    }, 5000);
    return () => {
        console.log('unsubscribe');
        clearInterval(t);
    };
});

api.mount({
    set(payload) {
        console.log('request set');
        Object.assign(this.session, payload);
        return this.session;
    },
    file({name}, stream) {
        console.log('request file ' + name);
        const outStream = fs.createWriteStream(__dirname + '/tmp/' + name);
        const p = new Promise(resolve => stream.once('end', resolve));
        stream.pipe(outStream);
        return p.then(() => true);
    }
});

const p = cp.spawn('see', ['test/index.html']);
process.on('exit', () => p.kill());

