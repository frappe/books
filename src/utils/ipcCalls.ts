/**
 * Utils that make ipcRenderer calls.
 */
const { ipcRenderer } = require('electron');
import { t } from 'fyo';
import { BaseError } from 'fyo/utils/errors';
import type { BackendResponse } from 'utils/ipc/types';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import type {
  LanguageMap,
  SelectFileOptions,
  SelectFileReturn,
  TemplateFile,
} from 'utils/types';
import { showDialog, showToast } from './interactive';
import { setLanguageMap } from './language';
import type { OpenDialogReturnValue } from 'electron';

export function reloadWindow() {
  return ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
}

export async function getLanguageMap(code: string) {
  return (await ipcRenderer.invoke(IPC_ACTIONS.GET_LANGUAGE_MAP, code)) as {
    languageMap: LanguageMap;
    success: boolean;
    message: string;
  };
}

export async function getSelectedFilePath(): Promise<OpenDialogReturnValue> {
  return (await ipcRenderer.invoke(IPC_ACTIONS.GET_OPEN_FILEPATH, {
    title: t`Select file`,
    properties: ['openFile'],
    filters: [{ name: 'SQLite DB File', extensions: ['db'] }],
  })) as OpenDialogReturnValue;
}

export async function getTemplates(): Promise<TemplateFile[]> {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.GET_TEMPLATES
  )) as TemplateFile[];
}

export async function selectFile(
  options: SelectFileOptions
): Promise<SelectFileReturn> {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.SELECT_FILE,
    options
  )) as SelectFileReturn;
}

export async function checkForUpdates() {
  await ipcRenderer.invoke(IPC_ACTIONS.CHECK_FOR_UPDATES);
  await setLanguageMap();
}

export function openLink(link: string) {
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, link);
}

export async function deleteDb(filePath: string) {
  const { error } = (await ipcRenderer.invoke(
    IPC_ACTIONS.DELETE_FILE,
    filePath
  )) as BackendResponse;

  if (error?.code === 'EBUSY') {
    await showDialog({
      title: t`Delete Failed`,
      detail: t`Please restart and try again.`,
      type: 'error',
    });
  } else if (error?.code === 'ENOENT') {
    await showDialog({
      title: t`Delete Failed`,
      detail: t`File ${filePath} does not exist.`,
      type: 'error',
    });
  } else if (error?.code === 'EPERM') {
    await showDialog({
      title: t`Cannot Delete`,
      detail: t`Close Frappe Books and try manually.`,
      type: 'error',
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

export function showItemInFolder(filePath: string) {
  ipcRenderer.send(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, filePath);
}

export async function makePDF(
  html: string,
  savePath: string,
  width: number,
  height: number
): Promise<void> {
  const success = (await ipcRenderer.invoke(
    IPC_ACTIONS.SAVE_HTML_AS_PDF,
    html,
    savePath,
    width,
    height
  )) as boolean;

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
    action: () => {
      showItemInFolder(filePath);
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
