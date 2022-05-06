import { app } from 'electron';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { Main } from '../main';

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
    if (main.isDevelopment && !process.env.IS_TEST) {
      try {
        await installExtension(VUEJS3_DEVTOOLS);
      } catch (e) {
        console.error(
          'Vue Devtools failed to install:',
          (e as Error).toString()
        );
      }
    }

    main.createWindow();
  });
}
