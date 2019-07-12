const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const logger = require('./logger');
const { getAppConfig, resolveAppDir } = require('./utils');
const { getConfig: getWebpackConfig } = require('./config');

const log = logger('serve');
const warn = logger('serve', 'red');

const appConfig = getAppConfig();
const webpackConfig = getWebpackConfig();

function addWebpackMiddleware(app) {
    log();
    log('Starting dev server...');

    addWebpackEntryPoints(webpackConfig);
    const compiler = webpack(webpackConfig);

    app.use(webpackDevMiddleware(compiler, {
        logLevel: 'silent',
        publicPath: webpackConfig.output.publicPath
    }));

    app.use(webpackHotMiddleware(compiler, {
        path: '/__webpack_hmr'
    }));
}

function startWebpackDevServer() {
    log();
    log('Starting dev server...');

    return new Promise(resolve => {
        addWebpackEntryPoints(webpackConfig, true);
        const compiler = webpack(webpackConfig);
        const server = new webpackDevServer(compiler, webpackConfig.devServer);

        const { devServerHost, devServerPort } = appConfig.dev;
        server.listen(devServerPort, devServerHost, () => {
            // listening on devServerPort

            compiler.hooks.done.tap('webpack done compiling', function() {
                resolve(server);
            });
        });
    })
}

function addWebpackEntryPoints(webpackConfig, forDevServer) {
    const devServerEntryPoints = [
        // resolveAppDir('node_modules/webpack-dev-server/client/index.js') + '?http://localhost',
        'webpack-dev-server/client/index.js?http://localhost',
        'webpack/hot/dev-server'
    ];
    const middlewareEntryPoints = [
        'webpack-hot-middleware/client?path=/__webpack_hmr'
    ];
    const entryPoints = forDevServer ? devServerEntryPoints : middlewareEntryPoints;
    const entry = webpackConfig.entry;

    Object.keys(entry).forEach(key => {
        entry[key] = [...entryPoints, entry[key]];
    });
}



module.exports = {
    addWebpackMiddleware,
    startWebpackDevServer
}
