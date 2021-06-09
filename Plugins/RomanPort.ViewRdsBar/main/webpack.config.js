const path = require('path');

module.exports = {
    resolve: {
        alias: {
            RaptorSdk: path.resolve(__dirname, 'sdk/')
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader'
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'out'),
        libraryTarget: "var",
        library: "RaptorPlugin"
    },
};