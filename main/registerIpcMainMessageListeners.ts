import { ipcMain, Menu, shell } from 'electron';
import { Main } from '../main';
import { IPC_MESSAGES } from '../utils/messages';
import { emitMainProcessError } from 'backend/helpers';

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
  
  ipcMain.on(IPC_MESSAGES.MINIMIZE_MAIN_WINDOW, () => {
    main.mainWindow!.minimize();
  });

  ipcMain.on(IPC_MESSAGES.MAXIMIZE_MAIN_WINDOW, () => {
    main.mainWindow!.isMaximized()?main.mainWindow!.unmaximize():main.mainWindow!.maximize()
  });

  ipcMain.on(IPC_MESSAGES.ISMAXIMIZED_MAIN_WINDOW, (event) => {
    const isMaximized = main.mainWindow?.isMaximized() ?? false;
  event.sender.send(IPC_MESSAGES.ISMAXIMIZED_RESULT, isMaximized);
  });

  ipcMain.on(IPC_MESSAGES.ISFULLSCREEN_MAIN_WINDOW, (event) => {
    const isFullscreen = main.mainWindow?.isFullScreen() ?? false;
  event.sender.send(IPC_MESSAGES.ISFULLSCREEN_RESULT, isFullscreen);
  });

  ipcMain.on(IPC_MESSAGES.CLOSE_MAIN_WINDOW, () => {
    main.mainWindow!.close();
  });

  ipcMain.on(IPC_MESSAGES.OPEN_EXTERNAL, (_, link: string) => {
    shell.openExternal(link).catch((err) => emitMainProcessError(err));
  });

  ipcMain.on(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, (_, filePath: string) => {
    return shell.showItemInFolder(filePath);
  });
}
