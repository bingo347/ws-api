export type Encoder = (input: unknown) => Uint8Array;
export type Decoder = (data: Uint8Array, extensionType: number) => unknown;
export type Extension = {
    encode: Encoder;
    decode: Decoder;
};

export const createExtension = (encode: Encoder, decode: Decoder): Extension => ({encode, decode});

export const extensions: Record<number, Extension> = {
};