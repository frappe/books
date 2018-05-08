const path = require('path');
const { getJSConfig, getCSSConfig } = require('frappejs/config/rollup');

module.exports = [
    getJSConfig({
        input: path.resolve(__dirname, 'www/index.js'),
        output: path.resolve(__dirname, 'www/dist/js/bundle.js'),
    }),
    getCSSConfig({
        input: path.resolve(__dirname, 'www/index.scss'),
        output: path.resolve(__dirname, 'www/dist/css/style.css'),
    })
]