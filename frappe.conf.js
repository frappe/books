
module.exports = {
  staticPath: './static',
  distPath: './dist',
  dev: {
    entryHtml: 'src/index.html',
    entry: {
      app: './src/main.js'
    },
    entryHtml: './src/index.html',
    srcDir: './src',
    outputDir: './dist',
    assetsPublicPath: '/',
    devServerPort: 8000,
    env: {
      PORT: process.env.PORT || 8000
    }
  },
  node: {
    paths: {
      main: 'server/index.js'
    }
  },
  electron: {
    entry: {
      app: './src/main-electron.js'
    },
    paths: {
      mainDev: 'src-electron/main.dev.js',
      main: 'src-electron/main.js',
      renderer: 'src/electron.js'
    }
  }
}