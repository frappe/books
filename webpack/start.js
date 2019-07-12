const { spawn } = require('child_process');
const { startWebpackDevServer } = require('./serve');
const { getAppConfig, resolveAppDir } = require('./utils');
const appConfig = getAppConfig();

module.exports = function start(mode) {
  process.env.NODE_ENV = 'development';

  if (mode === 'electron') {
    const electron = require('electron');
    const electronPaths = appConfig.electron.paths;

    startWebpackDevServer()
      .then((devServer) => {
        const p = spawn(electron, [resolveAppDir(electronPaths.mainDev)], { stdio: 'inherit' })
        p.on('close', () => {
          devServer.close();
        });
      });
  } else {
    const nodePaths = appConfig.node.paths;

    spawn('node', [resolveAppDir(nodePaths.main)], { stdio: 'inherit' })
  }
}