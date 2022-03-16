import { app } from 'electron';
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
}
