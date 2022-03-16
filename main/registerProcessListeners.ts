import { app } from 'electron';
import { Main } from '../main';
import { handleError } from '../src/errorHandling';

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

  process.on('unhandledRejection', (error: Error) => {
    handleError(true, error);
  });

  process.on('uncaughtException', (error) => {
    handleError(true, error, {}, () => process.exit(1));
  });
}
