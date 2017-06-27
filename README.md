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

- wsApi {function(url[, options])} return wsApi.Client instance
  - url {string} the browser has autodetect protocol (starts with '//') and host (starts with '/')
  - options {object}
    - uploadChunkSize {int} chunk size in bytes for uploads files
- client (EventEmitter events: 'error', 'close')
  - request {function(apiName, payload[, upload])}
    - apiName {string} mounted api on the server
    - payload {object | any} data for api
    - upload (browser) {File | Blob} file for upload
    - upload (node) {stream.Readable}
  - subscribe {function(channel, callback)}
    - channel {string} mounted channel on the server
    - callback {function(payload)} callback for server publish
  - unsubscribe {function(channel[, callback])}
    - channel {string} mounted channel on the server
    - callback {function(payload)} callback passed to subscribe, if don't set it delete all callbacks
- wsApi.Server {class(options)}
  - options {object} see [ws docs](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback)
    - server maybe ws.Server instance
- server
  - use {function(middleware)}
    - middleware {function(context, this: context)} extend context here, if it return promise, context wait when it will be resolved
  - mount {function(apiName, callback) | function([prefix, ]namedCallbacks)}
    - apiName {string} full name for api
    - callback {function(payload, uploadStream, context, this: context)} it called from client.request: return promise for transfer it to client; return any data, for resolve promise on the client; throw any error, for reject promise on the client
      - payload {object | any} data recived
      - uploadStream {stream.Readable} file upload stream
    - prefix {string} prefix for namedCallbacks methods
    - namedCallbacks {object} object with methods, see callback
  - channel {function(chanName, callback) | function([prefix, ]namedCallbacks)}
    - chanName {string} full name for channel
    - callback {function(publish, context, this: context)} it called when client first time call subscribe for channel, if it return function then it will be called when client unsubscribe channel
      - publish {function(payload)} call it any time for call subscribe callback on the client
    - prefix {string} prefix for namedCallbacks methods
    - namedCallbacks {object} object with methods, see callback
  - close {function(callback)} closse all connects and stop the server
- context {EventEmitter events: 'close'}
  - socket {ws.Socket}
  - request {http.IncomingMessage}
  - session {object} place your session data here
  - close {function(code, reason)} close connection

## License

MIT
