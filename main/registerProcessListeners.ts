import { app } from 'electron';
import { IPC_CHANNELS } from 'utils/messages';
import { Main } from '../main';

export default function registerProcessListeners(main: Main) {
  if (main.isDevelopment) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit') {
          app.quit();
        }
      });
    } else {
      process.on('SIGTERM', () => {
        app.quit();
      });
    }
  }

  process.on('unhandledRejection', (error) => {
    main.mainWindow!.webContents.send(IPC_CHANNELS.MAIN_PROCESS_ERROR, error);
  });

  process.on('uncaughtException', (error) => {
    main.mainWindow!.webContents.send(IPC_CHANNELS.MAIN_PROCESS_ERROR, error);
    setTimeout(() => process.exit(1), 10000);
  });
}
