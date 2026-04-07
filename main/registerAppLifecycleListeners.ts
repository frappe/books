import { app } from 'electron';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { Main } from '../main';
import { rendererLog } from './helpers';
import { emitMainProcessError } from 'backend/helpers';

export default function registerAppLifecycleListeners(main: Main) {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (main.mainWindow === null) {
      main.createWindow().catch((err) => emitMainProcessError(err));
    }
  });

  app
    .whenReady()
    .then(() => {
      if (main.isDevelopment && !main.isTest) {
        installDevTools(main).catch((err) => emitMainProcessError(err));
      }

      main.createWindow().catch((err) => emitMainProcessError(err));
    })
    .catch((err) => emitMainProcessError(err));
}

async function installDevTools(main: Main) {
  try {
    await installExtension(VUEJS_DEVTOOLS);
  } catch (e) {
    rendererLog(main, 'Vue Devtools failed to install', e);
  }
}
