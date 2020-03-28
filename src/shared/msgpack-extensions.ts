import {ExtensionEncoderType, ExtensionDecoderType} from '@msgpack/msgpack';

type Extension = {
    encode: ExtensionEncoderType<undefined>;
    decode: ExtensionDecoderType<undefined>;
};

export const createExtension = (
    encode: ExtensionEncoderType<undefined>,
    decode: ExtensionDecoderType<undefined>
): Extension => ({encode, decode});

export const extensions: Record<number, Extension> = {};