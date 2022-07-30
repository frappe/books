/**
 * Utils that make ipcRenderer calls.
 */
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { BaseError } from 'fyo/utils/errors';
import { BackendResponse } from 'utils/ipc/types';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { setLanguageMap } from './language';
import { showMessageDialog, showToast } from './ui';

export async function checkForUpdates() {
  await ipcRenderer.invoke(IPC_ACTIONS.CHECK_FOR_UPDATES);
  await setLanguageMap();
}

export async function openLink(link: string) {
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, link);
}

export async function deleteDb(filePath: string) {
  const { error } = (await ipcRenderer.invoke(
    IPC_ACTIONS.DELETE_FILE,
    filePath
  )) as BackendResponse;

  if (error?.code === 'EBUSY') {
    showMessageDialog({
      message: t`Delete Failed`,
      detail: t`Please restart and try again`,
    });
  } else if (error?.code === 'ENOENT') {
    showMessageDialog({
      message: t`Delete Failed`,
      detail: t`File ${filePath} does not exist`,
    });
  } else if (error?.code === 'EPERM') {
    showMessageDialog({
      message: t`Cannot Delete`,
      detail: t`Close Frappe Books and try manually`,
    });
  } else if (error) {
    const err = new BaseError(500, error.message);
    err.name = error.name;
    err.stack = error.stack;
    throw err;
  }
}

export async function saveData(data: string, savePath: string) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_DATA, data, savePath);
}

export async function showItemInFolder(filePath: string) {
  await ipcRenderer.send(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, filePath);
}

export async function makePDF(html: string, savePath: string) {
  const success = await ipcRenderer.invoke(
    IPC_ACTIONS.SAVE_HTML_AS_PDF,
    html,
    savePath
  );

  if (success) {
    showExportInFolder(t`Save as PDF Successful`, savePath);
  } else {
    showToast({ message: t`Export Failed`, type: 'error' });
  }
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
    filePath = `${filePath}.${extention}`;
  }

  return { canceled, filePath };
}
