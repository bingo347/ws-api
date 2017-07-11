# WS-API

Server and client library for implementing api on top of the websocket

## Install

```bash
npm install --save ws-api
```

## Requirements

- Promise (native or polyfill in global scope)
- async/await support (only for node.js), use node 7.6+ or node 8.0+ (recommended)

## Browser bundle sizes

- normal: 149.1kb
- minified: 58.8kb
- gziped: 17.6kb

## Usage examples

### client

```html
<body>
    <pre></pre>
    <input type="file">
</body>
```

```js
const api = require('ws-api')('//localhost:3000/');

 api.request('test/resolve').then(console.log.bind(console));
 api.request('test/reject').catch(console.log.bind(console));

document.addEventListener('DOMContentLoaded', () => {
    const pre = document.querySelector('pre');
    const input = document.querySelector('input');
    api.subscribe('session', payload => {
        pre.innerHTML = JSON.stringify(payload, null, 2);
    });
    input.addEventListener('change', () => {
        const file = input.files[0];
        if(!file) { return; }
        api.request('file', {name: file.name}, file);
    });
    void function e(test) {
        setTimeout(() => {
            api.request('set', {test}).then(e);
        }, 3000)
    }(true);
});
```

### server

```js
const fs = require('fs');
const {Server} = require('ws-api');

const api = new Server({port: 3000});

// In all your methods this is connection context
// The context is passed to the last arguments of the function
// (for use it in arrow functions)

api.use(ctx => {
    console.log('new session');
    ctx.once('close', () => {
        console.log('destroy session');
    });
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

api.mount('file', async ({name}, stream) => {
    console.log('request file ' + name);
    const outStream = fs.createWriteStream(__dirname + '/tmp/' + name);
    const p = new Promise(resolve => stream.once('end', resolve));
    stream.pipe(outStream);
    await p;
    return true;
});

api.mount('set', function(payload) {
    console.log('request set');
    Object.assign(this.session, payload);
    return this.session;
});

api.mount('test/', {
    resolve() { return {test: 'resolve'}; },
    reject() { throw {test: 'reject'} }
});
```

## Api docs

see [docs](./docs.md)

## License

MIT
