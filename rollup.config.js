import tsPlugin from '@wessberg/rollup-plugin-ts';

export default [{
    input: 'src/server.ts',
    output: {
        file: 'server.js',
        format: 'cjs'
    },
    plugins: [
        tsPlugin()
    ]
}, {
    input: 'src/client.ts',
    output: {
        file: 'client.js',
        format: 'es'
    },
    plugins: [
        tsPlugin()
    ]
}, {
    input: 'src/client.ts',
    output: {
        file: 'client.umd-es5.js',
        format: 'umd',
        name: 'ws-api'
    },
    plugins: [
        tsPlugin({
            tsconfig: conf => ({
                ...conf,
                target: 'ES5'
            })
        })
    ]
}];