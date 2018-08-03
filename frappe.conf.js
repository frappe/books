
module.exports = {
    dev: {
        entry: {
            app: './src/main.js'
        },
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
        paths: {
            mainDev: 'src-electron/main.dev.js',
            main: 'src-electron/main.js',
            renderer: 'src/electron.js'
        }
    }
}