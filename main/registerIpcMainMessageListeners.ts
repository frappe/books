import { ipcMain, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { Main } from '../main';
import { IPC_MESSAGES } from '../utils/messages';

export default function registerIpcMainMessageListeners(main: Main) {
  ipcMain.on(IPC_MESSAGES.OPEN_MENU, (event) => {
    if (event.sender === null) {
      return;
    }

    const menu = Menu.getApplicationMenu();
    if (menu === null) {
      return;
    }

    menu.popup({ window: main.mainWindow! });
  });

  ipcMain.on(IPC_MESSAGES.RELOAD_MAIN_WINDOW, () => {
    main.mainWindow!.reload();
  });

  ipcMain.on(IPC_MESSAGES.RESIZE_MAIN_WINDOW, (event, size, resizable) => {
    const [width, height] = size;
    if (!width || !height) return;
    main.mainWindow!.setSize(width, height);
    main.mainWindow!.setResizable(resizable);
  });

  ipcMain.on(IPC_MESSAGES.CLOSE_CURRENT_WINDOW, (event) => {
    main.mainWindow!.close();
  });

  ipcMain.on(IPC_MESSAGES.MINIMIZE_CURRENT_WINDOW, (event) => {
    main.mainWindow!.minimize();
  });

  ipcMain.on(IPC_MESSAGES.OPEN_EXTERNAL, (event, link) => {
    shell.openExternal(link);
  });

  ipcMain.on(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, (event, filePath) => {
    return shell.showItemInFolder(filePath);
  });

  ipcMain.on(IPC_MESSAGES.DOWNLOAD_UPDATE, (event) => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on(IPC_MESSAGES.INSTALL_UPDATE, (event) => {
    autoUpdater.quitAndInstall(true, true);
  });
}
