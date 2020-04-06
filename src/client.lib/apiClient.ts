import {PatchedExtensionCodec, defaultExtensionCodec, createEncoder, createDecoder} from '../shared/msgpack';

export type ApiClientOptions = {
    extensionCodec?: PatchedExtensionCodec;
};
export type ApiClient = {};

export function connect(url: string, options: ApiClientOptions = {}): ApiClient {
    const normalizedURL = normalizeURL(url);
    const extensionCodec = extractExtensionCodec(options);
    const encode = createEncoder(extensionCodec);
    const decode = createDecoder(extensionCodec);
    // TODO:
    normalizedURL;
    encode;
    decode;
    return {};
}

function extractExtensionCodec(options: ApiClientOptions): PatchedExtensionCodec {
    return (options.extensionCodec instanceof PatchedExtensionCodec
        ? options.extensionCodec
        : defaultExtensionCodec
    );
}

function normalizeURL(url: string): string {
    const [firstChar, secondChar] = url;
    return (firstChar !== '/'
        ? url
        : (secondChar === '/'
            ? `${getProtocol()}${url}`
            : `${getProtocol()}//${location.host}${url}`
        )
    );
}

function getProtocol() {
    return location.protocol === 'http:' ? 'ws:' : 'wss:';
}