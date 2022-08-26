import { app, dialog } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { Main } from '../main';
import { IPC_CHANNELS } from '../utils/messages';

export default function registerAutoUpdaterListeners(main: Main) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (error) => {
    if (!main.checkedForUpdate) {
      main.checkedForUpdate = true;
      return;
    }

    main.mainWindow!.webContents.send(IPC_CHANNELS.MAIN_PROCESS_ERROR, error);
    dialog.showErrorBox(
      'Update Error: ',
      error == null ? 'unknown' : (error.stack || error).toString()
    );
  });

  autoUpdater.on('update-available', async (info: UpdateInfo) => {
    const currentVersion = app.getVersion();
    const nextVersion = info.version;
    const isCurrentBeta = currentVersion.includes('beta');
    const isNextBeta = nextVersion.includes('beta');

    let downloadUpdate = true;
    if (!isCurrentBeta && isNextBeta) {
      const option = await dialog.showMessageBox({
        type: 'info',
        title: `Update Frappe Books?`,
        message: `Download version ${nextVersion}?`,
        buttons: ['Yes', 'No'],
      });

      downloadUpdate = option.response === 0;
    }

    if (!downloadUpdate) {
      return;
    }

    await autoUpdater.downloadUpdate();
  });
}
