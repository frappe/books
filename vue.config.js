const path = require('path');
const webpack = require('webpack');

module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      disableMainProcessTypescript: true,
      mainProcessTypeChecking: false,
      chainWebpackRendererProcess: (config) => {
        config.target('electron-renderer');
        config.resolve.alias.set('frappe', path.resolve(__dirname, './frappe'));
      },
      chainWebpackMainProcess: (config) => {
        config.target('electron-main');
        config.resolve.alias.set('frappe', path.resolve(__dirname, './frappe'));
        config.module
          .rule('js')
          .test(/\.js$/)
          .use('babel')
          .loader('babel-loader');
      },
    },
  },
  pages: {
    index: {
      entry: 'src/main.js',
      filename: 'index.html',
    },
    print: {
      entry: 'src/print.js',
      filename: 'print.html',
    },
  },
  runtimeCompiler: true,
  lintOnSave: process.env.NODE_ENV !== 'production',
  configureWebpack(config) {
    Object.assign(config.resolve.alias, {
      frappe: path.resolve(__dirname, './frappe'),
      '~': path.resolve('.'),
    });

    config.plugins.push(
      // https://github.com/knex/knex/issues/1446#issuecomment-537715431
      new webpack.ContextReplacementPlugin(
        /knex[/\\]lib[/\\]dialects/,
        /sqlite3[/\\]index.js/
      )
    );

    config.module.rules.push({
      test: /\.txt$/i,
      use: 'raw-loader',
    });

    config.devtool = 'source-map';
  },
};
