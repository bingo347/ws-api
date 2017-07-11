# ws-api docs

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