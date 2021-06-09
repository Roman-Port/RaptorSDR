const path = require('path');

module.exports = {
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            RaptorSdk: path.resolve(__dirname, 'sdk/')
        }
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'out'),
        libraryTarget: "var",
        library: "RaptorPlugin"
    },
};