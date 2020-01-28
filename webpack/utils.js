const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const defaultsDeep = require('lodash/defaultsDeep');
const logger = require('./logger');

const frappeConf = 'frappe.conf.js';

function getAppDir() {
  let dir = process.cwd();

  if (fs.existsSync(path.join(dir, frappeConf))) {
    return dir;
  }

  warn = logger('utils', 'red')

  warn();
  warn(`Looks like this is not the root of a FrappeJS project`);
  warn(`Please run this command from a folder which contains ${chalk.yellow(frappeConf)} file`);
  warn();
  process.exit(1);
}

function getAppConfig() {
  const defaults = {
    dev: {
      devServerHost: 'localhost',
      devServerPort: 8000
    }
  }
  const appConfig = require(path.resolve(getAppDir(), frappeConf));
  return defaultsDeep(defaults, appConfig);
}

function resolveAppDir(...args) {
  return path.resolve(getAppDir(), ...args);
}

module.exports = {
  getAppDir,
  getAppConfig,
  resolveAppDir
}
