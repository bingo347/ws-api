import tsPlugin from '@wessberg/rollup-plugin-ts';

export default {
    input: 'src/client.ts',
    output: {
        file: 'client.js',
        format: 'es'
    },
    plugins: [
        tsPlugin({
            tsconfig: {
                fileName: 'tsconfig.base.json',
                hook: conf => ({
                    ...conf,
                    module: 'ESNext'
                })
            }
        })
    ]
};