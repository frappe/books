import { app } from 'electron';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { Main } from '../main';
import { rendererLog } from './helpers';

export default function registerAppLifecycleListeners(main: Main) {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (main.mainWindow === null) {
      main.createWindow();
    }
  });

  app.on('ready', async () => {
    if (main.isDevelopment && !main.isTest) {
      await installDevTools(main);
    }

    main.createWindow();
  });
}

async function installDevTools(main: Main) {
  try {
    await installExtension(VUEJS3_DEVTOOLS);
  } catch (e) {
    rendererLog(main, 'Vue Devtools failed to install', e);
  }
}
