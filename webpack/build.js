const webpack = require('webpack');
const { getConfig, getElectronMainConfig } = require('./config');

module.exports = function build(mode) {
  const rendererConfig = getConfig();
  const mainConfig = getElectronMainConfig();

  process.env.NODE_ENV = 'production';

  if (mode === 'electron') {
    pack(rendererConfig)
      .then(result => {
        console.log(result);
      }).catch(err => {
        console.log(`\n  Failed to build renderer process`);
        console.error(`\n${err}\n`);
        process.exit(1)
      });

    pack(mainConfig)
      .then(result => {
        console.log(result);
      }).catch(err => {
        console.log(`\n  Failed to build main process`);
        console.error(`\n${err}\n`);
        process.exit(1)
      });
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