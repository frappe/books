const webpack = require('webpack');

// plugins
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsWebpackPlugin = require('case-sensitive-paths-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const { getAppConfig, resolveAppDir } = require('./utils');
const appDependencies = require(resolveAppDir('./package.json')).dependencies;
const frappeDependencies = require('../package.json').dependencies;

let getConfig, getElectronMainConfig;

function makeConfig() {
  const appConfig = getAppConfig();
  const isProduction = process.env.NODE_ENV === 'production';
  const isElectron = process.env.ELECTRON === 'true';
  const isMonoRepo = process.env.MONO_REPO === 'true';

  const whiteListedModules = ['vue'];
  const allDependencies = Object.assign(frappeDependencies, appDependencies);
  const externals = Object.keys(allDependencies).filter(
    d => !whiteListedModules.includes(d)
  );

  getConfig = function getConfig() {
    const config = {
      mode: isProduction ? 'production' : 'development',
      context: resolveAppDir(),
      entry: isElectron ? appConfig.electron.entry : appConfig.dev.entry,
      externals: isElectron ? externals : undefined,
      target: isElectron ? 'electron-renderer' : 'web',
      output: {
        path: isElectron
          ? resolveAppDir('./dist/electron')
          : resolveAppDir('./dist'),
        filename: '[name].js',
        // publicPath: appConfig.dev.assetsPublicPath,
        libraryTarget: isElectron ? 'commonjs2' : undefined
      },
      devtool: !isProduction ? 'cheap-module-eval-source-map' : '',
      module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader'
          },
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: file =>
              /node_modules/.test(file) && !/\.vue\.js/.test(file)
          },
          {
            test: /\.node$/,
            use: 'node-loader'
          },
          {
            test: /\.css$/,
            use: ['vue-style-loader', 'css-loader', {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            }]
          },
          {
            test: /\.scss$/,
            use: ['vue-style-loader', 'css-loader', 'sass-loader']
          },
          {
            test: /\.(png|svg|jpg|woff|woff2|gif)$/,
            use: ['file-loader']
          }
        ]
      },
      resolve: {
        extensions: ['.js', '.vue', '.json', '.css', '.node'],
        alias: {
          vue$: 'vue/dist/vue.esm.js',
          deepmerge$: 'deepmerge/dist/umd.js',
          '@': appConfig.dev.srcDir ? resolveAppDir(appConfig.dev.srcDir) : null
        }
      },
      plugins: [
        new webpack.DefinePlugin(
          Object.assign(
            {
              'process.env': appConfig.dev.env,
              'process.env.NODE_ENV': isProduction
                ? '"production"'
                : '"development"',
              'process.env.ELECTRON': JSON.stringify(process.env.ELECTRON)
            },
            !isProduction
              ? {
                  __static: `"${resolveAppDir(appConfig.staticPath).replace(
                    /\\/g,
                    '\\\\'
                  )}"`
                }
              : {}
          )
        ),
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
          template: resolveAppDir(appConfig.dev.entryHtml),
          nodeModules: !isProduction
            ? isMonoRepo
              ? resolveAppDir('../../node_modules')
              : resolveAppDir('./node_modules')
            : false
        }),
        new CaseSensitivePathsWebpackPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new FriendlyErrorsWebpackPlugin({
          compilationSuccessInfo: {
            messages: [
              `FrappeJS server started at http://${
                appConfig.dev.devServerHost
              }:${appConfig.dev.devServerPort}`
            ]
          }
        }),
        new webpack.ProgressPlugin(),
        isProduction
          ? new CopyWebpackPlugin([
              {
                from: resolveAppDir(appConfig.staticPath),
                to: resolveAppDir('./dist/electron/static'),
                ignore: ['.*']
              }
            ])
          : null
        // isProduction ? new BabiliWebpackPlugin() : null,
        // isProduction ? new webpack.LoaderOptionsPlugin({ minimize: true }) : null,
      ].filter(Boolean),
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
    };

    if (appConfig.configureWebpack) {
        let modifiedConfig = appConfig.configureWebpack(config);
        if (modifiedConfig) {
          return modifiedConfig;
        }
    }

    return config;
  };

  getElectronMainConfig = function getElectronMainConfig() {
    return {
      entry: {
        main: resolveAppDir(appConfig.electron.paths.main)
      },
      externals: externals,
      module: {
        rules: [
          {
            test: /\.js$/,
            use: 'babel-loader',
            exclude: /node_modules/
          },
          {
            test: /\.node$/,
            use: 'node-loader'
          }
        ]
      },
      node: {
        __dirname: !isProduction,
        __filename: !isProduction
      },
      output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: resolveAppDir('./dist/electron')
      },
      plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        // isProduction && new BabiliWebpackPlugin(),
        isProduction &&
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
          })
      ].filter(Boolean),
      resolve: {
        extensions: ['.js', '.json', '.node']
      },
      target: 'electron-main'
    };
  };
}

makeConfig();

module.exports = {
  getConfig,
  getElectronMainConfig
};
