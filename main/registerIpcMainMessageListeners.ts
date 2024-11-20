import { ipcMain, Menu, shell, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { Main } from '../main';
import { IPC_MESSAGES } from '../utils/messages';
import { emitMainProcessError } from 'backend/helpers';

function parseDataURL(url) {
  const regex =
    /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i;

  const parts = url.trim().match(regex);
  if (!parts) return null;

  const parsed = {};

  parsed.mediaType = (parts[1] || 'text/plain;charset=us-ascii').toLowerCase();

  const mediaTypeParts = parsed.mediaType
    .split(';')
    .map((x) => x.toLowerCase());
  parsed.contentType = mediaTypeParts[0];

  mediaTypeParts.slice(1).forEach((attribute) => {
    const p = attribute.split('=');
    parsed[p[0]] = p[1];
  });

  parsed.base64 = !!parts[parts.length - 2];
  parsed.data = parts[parts.length - 1] || '';
  parsed.encoding = parsed.base64 ? 'base64' : 'utf8';
  parsed.buffer = Buffer.from(
    parsed.base64 ? parsed.data : decodeURIComponent(parsed.data),
    parsed.encoding
  );

  return parsed;
}

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
    main.mainWindow!.isMaximized()
      ? main.mainWindow!.unmaximize()
      : main.mainWindow!.maximize();
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

  ipcMain.on(
    IPC_MESSAGES.OPEN_DATA_URL,
    (_, { link, filename }: { link: string; filename: string }) => {
      const data = parseDataURL(link);
      if (data) {
        const s =
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const temp = Array.apply(null, Array(16))
          .map(() => {
            return s.charAt(Math.floor(Math.random() * s.length));
          })
          .join('');
        const filepath = path.join(app.getPath('temp'), temp + ' ' + filename);
        fs.writeFileSync(filepath, data.buffer);
        shell.openPath(filepath);
      }
    }
  );

  ipcMain.on(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, (_, filePath: string) => {
    return shell.showItemInFolder(filePath);
  });
}
