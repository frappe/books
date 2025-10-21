import { dialog } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { emitMainProcessError } from '../backend/helpers';
import { Main } from '../main';
import { isNetworkError } from './helpers';

let availableUpdate: UpdateInfo | null = null;

export default function registerAutoUpdaterListeners(main: Main) {
  autoUpdater.autoDownload = false;
  autoUpdater.allowPrerelease = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (error) => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
    }

    if (isNetworkError(error)) {
      return;
    }

    emitMainProcessError(error);
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    void (async () => {
      const updateInfo = info;

      availableUpdate = updateInfo;

      await autoUpdater.downloadUpdate();
    })();
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  autoUpdater.on('update-downloaded', async () => {
    if (main.mainWindow && !main.mainWindow.isDestroyed()) {
      main.mainWindow.webContents.send('update-downloaded');
    }

    const option = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Downloaded',
      message: 'Restart Frappe Books to install update?',
      buttons: ['Yes', 'No'],
    });

    if (option.response === 1) {
      return;
    }

    availableUpdate = null;
    autoUpdater.quitAndInstall();
  });
}

export function getAvailableUpdate(): UpdateInfo | null {
  return availableUpdate;
}

export function clearAvailableUpdate(): void {
  availableUpdate = null;
}
