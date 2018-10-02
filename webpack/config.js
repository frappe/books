const path = require('path');
const webpack = require('webpack');
const { getAppConfig, resolveAppDir } = require('./utils');

const plugins = {
    NamedModules: webpack.NamedModulesPlugin,
    HotModuleReplacement: webpack.HotModuleReplacementPlugin,
    Define: webpack.DefinePlugin,
    Progress: webpack.ProgressPlugin,
    VueLoader: require('vue-loader/lib/plugin'),
    Html: require('html-webpack-plugin'),
    CaseSensitivePaths: require('case-sensitive-paths-webpack-plugin'),
    FriendlyErrors: require('friendly-errors-webpack-plugin'),
}

const appConfig = getAppConfig();
const isProduction = process.env.NODE_ENV === 'production';

function getConfig() {
    const config = {
        mode: isProduction ? 'production' : 'development',
        context: resolveAppDir(),
        entry: appConfig.dev.entry,
        output: {
            path: path.resolve(appConfig.dev.outputDir),
            filename: '[name].js',
            publicPath: appConfig.dev.assetsPublicPath
        },
        devtool: 'cheap-module-eval-source-map',
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: file => (
                        /node_modules/.test(file) &&
                        !/\.vue\.js/.test(file)
                    )
                },
                {
                    test: /\.css$/,
                    use: [
                        'vue-style-loader',
                        'css-loader'
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        'vue-style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    use: [
                      'file-loader'
                    ]
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.vue'],
            alias: {
                'vue$': 'vue/dist/vue.esm.js',
                'deepmerge$': 'deepmerge/dist/umd.js',
                '@': appConfig.dev.srcDir ? resolveAppDir(appConfig.dev.srcDir) : null
            }
        },
        plugins: [
            new plugins.Define({
                'process.env': appConfig.dev.env
            }),
            new plugins.VueLoader(),
            new plugins.Html({
                template: resolveAppDir(appConfig.dev.entryHtml)
            }),
            new plugins.CaseSensitivePaths(),
            new plugins.NamedModules(),
            new plugins.HotModuleReplacement(),
            new plugins.FriendlyErrors({
                compilationSuccessInfo: {
                    messages: [`FrappeJS server started at http://${appConfig.dev.devServerHost}:${appConfig.dev.devServerPort}`],
                },
            }),
            new plugins.Progress()
        ],
        optimization: {
            noEmitOnErrors: false
        },
        devServer: {
            // contentBase: './dist', // dist path is directly configured in express
            hot: true,
            quiet: true
        },
        node: {
            // prevent webpack from injecting useless setImmediate polyfill because Vue
            // source contains it (although only uses it if it's native).
            setImmediate: false,
            // process is injected via DefinePlugin, although some 3rd party
            // libraries may require a mock to work properly (#934)
            process: 'mock',
            // prevent webpack from injecting mocks to Node native modules
            // that does not make sense for the client
            dgram: 'empty',
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            child_process: 'empty'
        }
    }

    return config;
}

module.exports = getConfig;
