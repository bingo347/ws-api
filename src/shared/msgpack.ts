import {ExtensionCodec, ExtensionEncoderType, ExtensionDecoderType} from '@msgpack/msgpack';
import {extensions} from './msgpack-extensions';

// [0..63]: application-specific types
// [64..127]: reserved for ws-api predefined types
// [-128..-1]: reserved for msgpack predefined types
class PatchedExtensionCodec<CodecContextType> extends ExtensionCodec<CodecContextType> {
    private __protectType = false;
    register(extension: {
        type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63;
        encode: ExtensionEncoderType<CodecContextType>;
        decode: ExtensionDecoderType<CodecContextType>;
    }): void {
        const {type} = extension;
        // eslint-disable-next-line fp/no-this
        if(this.__protectType && (type < 0 || type > 63)) {
            // eslint-disable-next-line fp/no-throw
            throw new RangeError('Application-specific types must be in [0..63] range');
        }
        return super.register(extension);
    }

    /* eslint-disable fp/no-this */
    __protect(): this {
        // eslint-disable-next-line fp/no-mutation
        this.__protectType = true;
        return this;
    }
    /* eslint-enable fp/no-this */
}

export function createExtensionCodec<CodecContextType = undefined>(): PatchedExtensionCodec<CodecContextType> {
    const extensionCodec = new PatchedExtensionCodec<CodecContextType>();
    Object.keys(extensions).map(t => parseInt(t)).forEach(type => (
        ExtensionCodec.prototype.register.call(extensionCodec, {...extensions[type], type})
    ));
    return extensionCodec.__protect();
}

export const defaultExtensionCodec = createExtensionCodec();