import { app, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import fs from 'fs/promises';
import path from 'path';
import databaseManager from '../backend/database/manager';
import { emitMainProcessError } from '../backend/helpers';
import { Main } from '../main';
import { DatabaseMethod } from '../utils/db/types';
import { IPC_ACTIONS } from '../utils/messages';
import { getUrlAndTokenString, sendError } from './contactMothership';
import { getLanguageMap } from './getLanguageMap';
import {
  getConfigFilesWithModified,
  getErrorHandledReponse,
  isNetworkError,
  setAndGetCleanedConfigFiles
} from './helpers';
import { saveHtmlAsPdf } from './saveHtmlAsPdf';

export default function registerIpcMainActionListeners(main: Main) {
  ipcMain.handle(IPC_ACTIONS.GET_OPEN_FILEPATH, async (event, options) => {
    return await dialog.showOpenDialog(main.mainWindow!, options);
  });

  ipcMain.handle(IPC_ACTIONS.GET_SAVE_FILEPATH, async (event, options) => {
    return await dialog.showSaveDialog(main.mainWindow!, options);
  });

  ipcMain.handle(IPC_ACTIONS.GET_DIALOG_RESPONSE, async (event, options) => {
    if (main.isDevelopment || main.isLinux) {
      Object.assign(options, { icon: main.icon });
    }

    return await dialog.showMessageBox(main.mainWindow!, options);
  });

  ipcMain.handle(IPC_ACTIONS.SHOW_ERROR, async (event, { title, content }) => {
    return await dialog.showErrorBox(title, content);
  });

  ipcMain.handle(
    IPC_ACTIONS.SAVE_HTML_AS_PDF,
    async (event, html, savePath) => {
      return await saveHtmlAsPdf(html, savePath, app);
    }
  );

  ipcMain.handle(IPC_ACTIONS.SAVE_DATA, async (event, data, savePath) => {
    return await fs.writeFile(savePath, data, { encoding: 'utf-8' });
  });

  ipcMain.handle(IPC_ACTIONS.SEND_ERROR, (event, bodyJson) => {
    sendError(bodyJson);
  });

  ipcMain.handle(IPC_ACTIONS.CHECK_FOR_UPDATES, async () => {
    if (main.isDevelopment || main.checkedForUpdate) {
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      if (isNetworkError(error as Error)) {
        return;
      }

      emitMainProcessError(error);
    }
    main.checkedForUpdate = true;
  });

  ipcMain.handle(IPC_ACTIONS.GET_LANGUAGE_MAP, async (event, code) => {
    const obj = { languageMap: {}, success: true, message: '' };
    try {
      obj.languageMap = await getLanguageMap(code);
    } catch (err) {
      obj.success = false;
      obj.message = (err as Error).message;
    }

    return obj;
  });

  ipcMain.handle(IPC_ACTIONS.GET_FILE, async (event, options) => {
    const response = {
      name: '',
      filePath: '',
      success: false,
      data: Buffer.from('', 'utf-8'),
      canceled: false,
    };
    const { filePaths, canceled } = await dialog.showOpenDialog(
      main.mainWindow!,
      options
    );

    response.filePath = filePaths?.[0];
    response.canceled = canceled;

    if (!response.filePath) {
      return response;
    }

    response.success = true;
    if (canceled) {
      return response;
    }

    response.name = path.basename(response.filePath);
    response.data = await fs.readFile(response.filePath);
    return response;
  });

  ipcMain.handle(IPC_ACTIONS.GET_CREDS, async (event) => {
    return await getUrlAndTokenString();
  });

  ipcMain.handle(IPC_ACTIONS.DELETE_FILE, async (_, filePath) => {
    return getErrorHandledReponse(async () => await fs.unlink(filePath));
  });

  ipcMain.handle(IPC_ACTIONS.GET_DB_LIST, async (_) => {
    const files = await setAndGetCleanedConfigFiles();
    return await getConfigFilesWithModified(files);
  });

  ipcMain.handle(IPC_ACTIONS.GET_ENV, async (_) => {
    return {
      isDevelopment: main.isDevelopment,
      platform: process.platform,
      version: app.getVersion(),
    };
  });

  /**
   * Database Related Actions
   */

  ipcMain.handle(
    IPC_ACTIONS.DB_CREATE,
    async (_, dbPath: string, countryCode: string) => {
      return await getErrorHandledReponse(async function dbFunc() {
        return await databaseManager.createNewDatabase(dbPath, countryCode);
      });
    }
  );

  ipcMain.handle(
    IPC_ACTIONS.DB_CONNECT,
    async (_, dbPath: string, countryCode?: string) => {
      return await getErrorHandledReponse(async function dbFunc() {
        return await databaseManager.connectToDatabase(dbPath, countryCode);
      });
    }
  );

  ipcMain.handle(
    IPC_ACTIONS.DB_CALL,
    async (_, method: DatabaseMethod, ...args: unknown[]) => {
      return await getErrorHandledReponse(async function dbFunc() {
        return await databaseManager.call(method, ...args);
      });
    }
  );

  ipcMain.handle(
    IPC_ACTIONS.DB_BESPOKE,
    async (_, method: string, ...args: unknown[]) => {
      return await getErrorHandledReponse(async function dbFunc() {
        return await databaseManager.callBespoke(method, ...args);
      });
    }
  );

  ipcMain.handle(IPC_ACTIONS.DB_SCHEMA, async (_) => {
    return await getErrorHandledReponse(async function dbFunc() {
      return await databaseManager.getSchemaMap();
    });
  });
}
