const webpack = require('webpack');
const getWebpackConfig = require('./config');

module.exports = function build(mode) {
  const webpackConfig = getWebpackConfig();
  process.env.NODE_ENV = 'production';

  if (mode === 'electron') {
    pack(webpackConfig)
      .then(result => {
        console.log(result);
      }).catch(err => {
        console.log(`\n  Failed to build renderer process`);
        console.error(`\n${err}\n`);
        process.exit(1)
      })
  }
}

function pack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)

      else if (stats.hasErrors()) {
        let err = ''

        stats
          .toString({
            chunks: false,
            colors: true
          })
          .split(/\r?\n/)
          .forEach(line => {
            err += `    ${line}\n`
          });

        reject(err);
      } else {
        resolve(stats.toString({
          chunks: false,
          colors: true
        }));
      }
    });
  });
}