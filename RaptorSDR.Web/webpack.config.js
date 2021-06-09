const path = require('path');

module.exports = (env) => {
    return {
        entry: './src/index.js',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(png|jpg|gif|svg)$/i,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 8192,
                            },
                        },
                    ],
                }
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                'raptorlib': path.join(__dirname, 'node_modules/raptorsdr.web.common'),
                'icons': path.join(__dirname, 'src/icons'),
                'RaptorSdk': path.resolve(__dirname, 'sdk/')
            }
        },
        output: {
            filename: 'RaptorSDR.js',
            path: env.RAPTORSDR_USER + '/web/',
            libraryTarget: "var",
            library: "RaptorApp"
        }
    }
};