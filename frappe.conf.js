// frappe.conf.js template
module.exports = {
  staticPath: './static',
  distPath: './dist',
  dev: {
    entryHtml: 'index.html',
    srcDir: 'src',
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