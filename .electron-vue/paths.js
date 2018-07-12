const path = require('path');

module.exports = {
  renderer: path.resolve(__dirname, '../src/main.js'),
  main: path.resolve(__dirname, '../electron-main/index.js'),
  mainDev: path.resolve(__dirname, '../electron-main/index.dev.js'),
  index: path.resolve(__dirname, '../src/index.ejs')
}