const webpack = require('webpack');
const { getAppConfig, resolveAppDir } = require('./utils');
const appDependencies = require(resolveAppDir('./package.json')).dependencies;
const frappeDependencies = require('../package.json').dependencies;

function getConfig() {
  const plugins = {
    NamedModules: webpack.NamedModulesPlugin,
    HotModuleReplacement: webpack.HotModuleReplacementPlugin,
    Define: webpack.DefinePlugin,
    Progress: webpack.ProgressPlugin,
    VueLoader: require('vue-loader/lib/plugin'),
    Html: require('html-webpack-plugin'),
    CaseSensitivePaths: require('case-sensitive-paths-webpack-plugin'),
    FriendlyErrors: require('friendly-errors-webpack-plugin'),
    CopyWebpackPlugin: require('copy-webpack-plugin')
  }

  const appConfig = getAppConfig();
  const isProduction = process.env.NODE_ENV === 'production';
  const isElectron = process.env.ELECTRON === 'true';
  const isMonoRepo = process.env.MONO_REPO === 'true';

  const whiteListedModules = ['vue'];
  const allDependencies = Object.assign(frappeDependencies, appDependencies);
  const externals = Object.keys(allDependencies).filter(d => !whiteListedModules.includes(d))

  const config = {
    mode: isProduction ? 'production' : 'development',
    context: resolveAppDir(),
    entry: isElectron ? appConfig.electron.entry : appConfig.dev.entry,
    externals: isElectron ? externals : null,
    target: isElectron ? 'electron-renderer' : 'web',
    output: {
      path: isElectron ? resolveAppDir('./dist/electron') : resolveAppDir('./dist'),
      filename: '[name].js',
      // publicPath: appConfig.dev.assetsPublicPath,
      libraryTarget: isElectron ? 'commonjs2' : null
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
          exclude: file => (
            /node_modules/.test(file) &&
            !/\.vue\.js/.test(file)
          )
        },
        {
          test: /\.node$/,
          use: 'node-loader'
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
      extensions: ['.js', '.vue', '.json', '.css', '.node'],
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        'deepmerge$': 'deepmerge/dist/umd.js',
        '@': appConfig.dev.srcDir ? resolveAppDir(appConfig.dev.srcDir) : null
      }
    },
    plugins: [
      new plugins.Define(Object.assign({
        'process.env': appConfig.dev.env,
        'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      }, !isProduction ? {
        '__static': `"${resolveAppDir(appConfig.staticPath).replace(/\\/g, '\\\\')}"`
      } : {})),
      new plugins.VueLoader(),
      new plugins.Html({
        template: resolveAppDir(appConfig.dev.entryHtml),
        nodeModules: !isProduction
          ? isMonoRepo ? resolveAppDir('../../node_modules') : resolveAppDir('./node_modules')
          : false
      }),
      new plugins.CaseSensitivePaths(),
      new plugins.NamedModules(),
      new plugins.HotModuleReplacement(),
      new plugins.FriendlyErrors({
        compilationSuccessInfo: {
          messages: [`FrappeJS server started at http://${appConfig.dev.devServerHost}:${appConfig.dev.devServerPort}`],
        },
      }),
      new plugins.Progress(),
      isProduction ? new plugins.CopyWebpackPlugin([
        {
          from: resolveAppDir(appConfig.staticPath),
          to: resolveAppDir('./dist/electron/static'),
          ignore: ['.*']
        },
        {
          from: resolveAppDir(appConfig.electron.paths.main),
          to: resolveAppDir('./dist/electron/main.js')
        }
      ]) : null,
      // isProduction ? new BabiliWebpackPlugin() : null,
      // isProduction ? new webpack.LoaderOptionsPlugin({ minimize: true }) : null,
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
