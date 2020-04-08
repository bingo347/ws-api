import tsPlugin from '@wessberg/rollup-plugin-ts';

export default [{
    input: 'src/server.ts',
    output: {
        file: 'server.js',
        format: 'cjs'
    },
    external: ['events', 'ws', '@msgpack/msgpack'],
    plugins: [
        tsPlugin()
    ]
}, {
    input: 'src/client.ts',
    output: {
        file: 'client.js',
        format: 'es'
    },
    external: ['@msgpack/msgpack'],
    plugins: [
        tsPlugin()
    ]
}, {
    input: 'src/client.ts',
    output: {
        file: 'client.umd-es5.js',
        format: 'umd',
        name: 'wsApi',
        globals: {
            '@msgpack/msgpack': 'msgpack'
        }
    },
    external: ['@msgpack/msgpack'],
    plugins: [
        tsPlugin({
            tsconfig: conf => ({
                ...conf,
                target: 'ES5',
                downlevelIteration: true
            })
        })
    ]
}];