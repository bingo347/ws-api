import tsPlugin from '@wessberg/rollup-plugin-ts';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [{
    input: 'src/server.ts',
    output: {
        file: 'server.js',
        format: 'cjs'
    },
    external: ['events', 'ws', '@msgpack/msgpack', '@lambda-fn/cell'],
    plugins: [
        tsPlugin()
    ]
}, {
    input: 'src/client.ts',
    output: {
        file: 'client.js',
        format: 'es'
    },
    external: ['@msgpack/msgpack', '@lambda-fn/cell'],
    plugins: [
        tsPlugin()
    ]
}, {
    input: 'src/client.ts',
    output: {
        file: 'client.umd-es5.js',
        format: 'umd',
        name: 'wsApi'
    },
    plugins: [
        tsPlugin({
            tsconfig: conf => ({
                ...conf,
                target: 'ES5',
                downlevelIteration: true
            })
        }),
        resolve(),
        commonjs()
    ]
}];