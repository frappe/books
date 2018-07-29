const ms = require('ms');
const chalk = require('chalk');

let prevTime;

module.exports = function (banner, color = 'green') {
  return function (message) {
    const currentTime = +new Date();
    const diff = currentTime - (prevTime || currentTime);
    prevTime = currentTime;

    if (message) {
      console.log(` ${chalk[color](banner)} ${message} ${chalk.green(`+${ms(diff)}`)}`)
    }
    else {
      console.log()
    }
  }
}
