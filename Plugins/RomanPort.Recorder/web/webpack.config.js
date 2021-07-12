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
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
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