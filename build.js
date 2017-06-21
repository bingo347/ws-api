'use strict';

const pkg = require('./package.json');
const path = require('path');
const webpack = require('webpack');

const compiler = webpack({
    entry: path.join(__dirname, 'lib/browser.js'),
    output: {
        filename: pkg.browser,
        path: path.join(__dirname),
        sourceMapFilename: pkg.browser + '.map',
        library: pkg.name,
        libraryTarget: 'commonjs2'
    },
    module: {
        rules: [{
            loader: 'babel-loader',
            test: /\.js$/,
            query: {
                presets: ['es2015']
            }
        }]
    },
    target: 'web',
    devtool: '#source-map'
});

module.exports = compiler;

if(process.env.npm_config_argv) {
    const npmArgv = JSON.parse(process.env.npm_config_argv);
    if((npmArgv.cooked && npmArgv.cooked.includes('build')) || (npmArgv.original && npmArgv.original.includes('build'))) {
        compiler.run((err, stats) => {
            if(err) {
                console.error(err);
                process.exit(1);
                return;
            }
            console.log(stats);
            process.exit(0);
        });
    }
}
