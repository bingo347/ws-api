export type Encoder = (input: unknown) => Uint8Array;
export type Decoder = (data: Uint8Array) => unknown;
export type ExtensionDecoder = (data: Uint8Array, extensionType: number) => unknown;
export type Extension = {
    encode: Encoder;
    decode: ExtensionDecoder;
};

export const createExtension = (encode: Encoder, decode: ExtensionDecoder): Extension => ({encode, decode});

export const extensions: Record<number, Extension> = {
};