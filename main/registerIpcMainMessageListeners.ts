import { ipcMain, Menu, shell, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { Main } from '../main';
import { IPC_MESSAGES } from '../utils/messages';
import { emitMainProcessError } from 'backend/helpers';

type DataURLParseResult = {
  mediaType: string;
  contentType: string;
  base64: string;
  data: string;
  encoding: string;
  buffer: Buffer;
};
function parseDataURL(url: string): null | DataURLParseResult {
  const regex =
    /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i;

  const parts = url.trim().match(regex);
  if (!parts) return null;

  const mediaType = (parts[1] || 'text/plain;charset=us-ascii').toLowerCase();

  const mediaTypeParts: string[] = mediaType
    .split(';')
    .map((x: string) => x.toLowerCase());
  const contentType = mediaTypeParts[0];

  mediaTypeParts.slice(1).forEach((attribute) => {
    const p = attribute.split('=');
    if (p.length >= 2) (parsed as object)[p[0]] = p[1];
  });

  const base64 = !!parts[parts.length - 2];
  const data = parts[parts.length - 1] || '';
  const encoding = base64 ? 'base64' : 'utf8';
  const buffer = Buffer.from(
    base64 ? data : decodeURIComponent(data),
    encoding
  );

  return { mediaType, contentType, base64, data, encoding, buffer };
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
        const s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const temp = Array.from(Array(16), () =>
          s.charAt(Math.floor(Math.random() * s.length))
        ).join('');
        const filepath = path.join(app.getPath('temp'), `${temp} ${filename}`);
        fs.writeFileSync(filepath, data.buffer);
        void shell.openPath(filepath);
      }
    }
  );

  ipcMain.on(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, (_, filePath: string) => {
    return shell.showItemInFolder(filePath);
  });
}
