const path = require('path');
const webpack = require('webpack');

module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: ['knex', 'sqlite3'],
      nodeIntegration: true,
      mainProcessFile: 'main.ts',
      // rendererProcessFile: 'src/renderer.js',
      disableMainProcessTypescript: false,
      mainProcessTypeChecking: true,
      chainWebpackRendererProcess: (config) => {
        config.target('electron-renderer');
        config.resolve.alias.set('fyo', path.resolve(__dirname, './fyo'));
        config.resolve.alias.set('utils', path.resolve(__dirname, './utils'));
      },
      chainWebpackMainProcess: (config) => {
        config.target('electron-main');
        config.resolve.alias.set('fyo', path.resolve(__dirname, './fyo'));
        config.resolve.alias.set('utils', path.resolve(__dirname, './utils'));
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
      entry: 'src/renderer.ts',
      filename: 'index.html',
    },
    print: {
      entry: 'src/print.ts',
      filename: 'print.html',
    },
  },
  runtimeCompiler: true,
  lintOnSave: process.env.NODE_ENV !== 'production',
  configureWebpack(config) {
    Object.assign(config.resolve.alias, {
      fyo: path.resolve(__dirname, './fyo'),
      src: path.resolve(__dirname, './src'),
      schemas: path.resolve(__dirname, './schemas'),
      backend: path.resolve(__dirname, './backend'),
      models: path.resolve(__dirname, './models'),
      utils: path.resolve(__dirname, './utils'),
      regional: path.resolve(__dirname, './regional'),
      reports: path.resolve(__dirname, './reports'),
      fixtures: path.resolve(__dirname, './fixtures'),
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
