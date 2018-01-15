const path = require('path');

module.exports = {
    entry: './index.js',
    devServer: {
        contentBase: path.join(__dirname),
        compress: true,
        port: 9000,
    },
    devtool: 'inline-source-map',
    output: {
        filename: './js/bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
            {
                loader: "style-loader" // creates style nodes from JS strings
            },
            {
                loader: "css-loader" // translates CSS into CommonJS
            },
            {
                loader: 'postcss-loader', // Run post css actions
                options: {
                  plugins: function () { // post css plugins, can be exported to postcss.config.js
                    return [
                      require('precss'),
                      require('autoprefixer')
                    ];
                  }
                },
            },
            {
                loader: "sass-loader", // compiles Sass to CSS
                options: {
                    includePaths: ["node_modules", "./client/scss"]
                }
            }]
        }]
    }
};