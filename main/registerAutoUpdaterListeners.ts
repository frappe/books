import { autoUpdater } from 'electron-updater';
import { Main } from '../main';
import { IPC_CHANNELS } from '../utils/messages';

export default function registerAutoUpdaterListeners(main: Main) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (error) => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
      return;
    }

    main.mainWindow!.webContents.send(IPC_CHANNELS.MAIN_PROCESS_ERROR, error);
  });
}
