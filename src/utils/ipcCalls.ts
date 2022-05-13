/**
 * Utils that make ipcRenderer calls.
 */
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { setLanguageMap } from './language';
import { WindowAction } from './types';
import { showToast } from './ui';

export async function checkForUpdates(force = false) {
  await ipcRenderer.invoke(IPC_ACTIONS.CHECK_FOR_UPDATES, force);
  await setLanguageMap();
}

export async function deleteDb(filePath: string) {
  await ipcRenderer.invoke(IPC_ACTIONS.DELETE_FILE, filePath);
}

export async function saveData(data: string, savePath: string) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_DATA, data, savePath);
}

export async function showItemInFolder(filePath: string) {
  await ipcRenderer.send(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, filePath);
}

export async function makePDF(html: string, savePath: string) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_HTML_AS_PDF, html, savePath);
  showExportInFolder(t`Save as PDF Successful`, savePath);
}

export async function runWindowAction(name: WindowAction) {
  switch (name) {
    case 'close':
      ipcRenderer.send(IPC_MESSAGES.CLOSE_CURRENT_WINDOW);
      break;
    case 'minimize':
      ipcRenderer.send(IPC_MESSAGES.MINIMIZE_CURRENT_WINDOW);
      break;
    case 'maximize':
      const maximized = await ipcRenderer.invoke(
        IPC_ACTIONS.TOGGLE_MAXIMIZE_CURRENT_WINDOW
      );
      name = maximized ? 'unmaximize' : name;
      break;
    default:
      throw new Error(`invalid window action ${name}`);
  }
  return name;
}

export function showExportInFolder(message: string, filePath: string) {
  showToast({
    message,
    actionText: t`Open Folder`,
    type: 'success',
    action: async () => {
      await showItemInFolder(filePath);
    },
  });
}

export async function getSavePath(name: string, extention: string) {
  const response = (await ipcRenderer.invoke(IPC_ACTIONS.GET_SAVE_FILEPATH, {
    title: t`Select Folder`,
    defaultPath: `${name}.${extention}`,
  })) as { canceled: boolean; filePath?: string };

  const canceled = response.canceled;
  let filePath = response.filePath;

  if (filePath && !filePath.endsWith(extention)) {
    filePath = filePath + extention;
  }

  return { canceled, filePath };
}
