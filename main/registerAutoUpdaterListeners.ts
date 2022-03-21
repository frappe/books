import { autoUpdater, UpdateInfo } from 'electron-updater';
import { Main } from '../main';
import { IPC_CHANNELS } from '../src/messages';

export default function registerAutoUpdaterListeners(main: Main) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    if (!main.checkedForUpdate) {
      return;
    }

    main.mainWindow!.webContents.send(IPC_CHANNELS.CHECKING_FOR_UPDATE);
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
    }

    main.mainWindow!.webContents.send(
      IPC_CHANNELS.UPDATE_AVAILABLE,
      info.version
    );
  });

  autoUpdater.on('update-not-available', () => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
      return;
    }

    main.mainWindow!.webContents.send(IPC_CHANNELS.UPDATE_NOT_AVAILABLE);
  });

  autoUpdater.on('update-downloaded', () => {
    main.mainWindow!.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED);
  });

  autoUpdater.on('error', (error) => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
      return;
    }

    main.mainWindow!.webContents.send(IPC_CHANNELS.UPDATE_ERROR, error);
  });
}
