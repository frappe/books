const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  staticPath: './static',
  distPath: './dist',
  dev: {
    entry: {
      app: './src/main.js'
    },
    entryHtml: './src/index.html',
    srcDir: './src',
    outputDir: './dist',
    assetsPublicPath: '/',
    devServerPort: 8080,
    env: {
      PORT: process.env.PORT || 8080
    }
  },
  node: {
    paths: {
      main: 'server/index.js'
    }
  },
  electron: {
    entry: {
      app: './src/main-electron.js',
      print: './src/print.js'
    },
    paths: {
      mainDev: 'src-electron/main.dev.js',
      main: 'src-electron/main.js',
      renderer: 'src/electron.js'
    }
  },
  configureWebpack(config) {
    config.plugins.push(
      new HtmlWebpackPlugin({
        chunks: ['print'],
        filename: 'static/print.html',
        template: 'src/print.html'
      })
    );
  }
};
