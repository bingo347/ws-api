export type Encoder = (input: unknown) => ArrayBufferLike;
export type Decoder = (data: Uint8Array) => unknown;
export type ExtensionEncoder = (input: unknown) => Uint8Array;
export type ExtensionDecoder = (data: Uint8Array, extensionType: number) => unknown;
export type Extension = {
    encode: ExtensionEncoder;
    decode: ExtensionDecoder;
};

export const createExtension = (encode: ExtensionEncoder, decode: ExtensionDecoder): Extension => ({encode, decode});

export const extensions: Record<number, Extension> = {
};