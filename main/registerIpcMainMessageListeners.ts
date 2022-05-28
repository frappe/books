import { ipcMain, Menu, shell } from 'electron';
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

  ipcMain.on(IPC_MESSAGES.OPEN_EXTERNAL, (_, link) => {
    shell.openExternal(link);
  });

  ipcMain.on(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, (_, filePath) => {
    return shell.showItemInFolder(filePath);
  });
}
