import {encode, decode, ExtensionEncoderType, ExtensionDecoderType} from '@msgpack/msgpack';
import {isCommunication, createCommunication, packCommunication} from './communications';

type Extension = {
    encode: ExtensionEncoderType<undefined>;
    decode: ExtensionDecoderType<undefined>;
};

/* eslint-disable no-shadow */
export const createExtension = (
    encode: ExtensionEncoderType<undefined>,
    decode: ExtensionDecoderType<undefined>
): Extension => ({encode, decode});
/* eslint-enable no-shadow */

export const extensions: Record<number, Extension> = {
    127: createExtension(
        // eslint-disable-next-line fp/no-nil
        (value: unknown) => (isCommunication(value) ? encode(packCommunication(value)) : null),
        // @ts-ignore
        (data: Uint8Array) => createCommunication(...decode(data))
    )
};