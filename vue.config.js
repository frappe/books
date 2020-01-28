const path = require('path');
const webpack = require('webpack');

module.exports = {
  pages: {
    index: {
      entry: 'src/main.js',
      filename: 'index.html'
    },
    print: {
      entry: 'src/print.js',
      filename: 'print.html'
    }
  },
  runtimeCompiler: true,
  lintOnSave: process.env.NODE_ENV !== 'production',
  configureWebpack(config) {
    Object.assign(config.resolve.alias, {
      deepmerge$: 'deepmerge/dist/umd.js',
      'frappe-charts$': 'frappe-charts/dist/frappe-charts.esm.js',
      '~': path.resolve('.')
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
      use: 'raw-loader'
    });

    config.devtool = 'source-map';
  },
  transpileDependencies: ['frappejs']
};
