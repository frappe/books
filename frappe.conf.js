
module.exports = {
  staticPath: './static',
  distPath: './dist',
  dev: {
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
  }
}