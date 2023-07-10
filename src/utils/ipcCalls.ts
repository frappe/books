/**
 * Utils that make ipcRenderer calls.
 */
const { ipcRenderer } = require('electron');
import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron';
import type { BackendResponse } from 'utils/ipc/types';
import { IPC_ACTIONS, IPC_CHANNELS, IPC_MESSAGES } from 'utils/messages';
import type {
  ConfigFilesWithModified,
  LanguageMap,
  SelectFileOptions,
  SelectFileReturn,
  TemplateFile,
} from 'utils/types';

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

export async function getOpenFilePath(options: OpenDialogOptions) {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.GET_OPEN_FILEPATH,
    options
  )) as OpenDialogReturnValue;
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

export async function checkDbAccess(filePath: string) {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.CHECK_DB_ACCESS,
    filePath
  )) as boolean;
}

export async function checkForUpdates() {
  await ipcRenderer.invoke(IPC_ACTIONS.CHECK_FOR_UPDATES);
}

export function openLink(link: string) {
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, link);
}

export async function deleteFile(filePath: string) {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.DELETE_FILE,
    filePath
  )) as BackendResponse;
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
): Promise<boolean> {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.SAVE_HTML_AS_PDF,
    html,
    savePath,
    width,
    height
  )) as boolean;
}

export async function getSaveFilePath(options: SaveDialogOptions) {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.GET_SAVE_FILEPATH,
    options
  )) as SaveDialogReturnValue;
}

export async function getDbList() {
  return (await ipcRenderer.invoke(
    IPC_ACTIONS.GET_DB_LIST
  )) as ConfigFilesWithModified[];
}

export async function getEnv() {
  return (await ipcRenderer.invoke(IPC_ACTIONS.GET_ENV)) as {
    isDevelopment: boolean;
    platform: string;
    version: string;
  };
}

export function openExternalUrl(url: string) {
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, url);
}

export async function showError(title: string, content: string) {
  await ipcRenderer.invoke(IPC_ACTIONS.SHOW_ERROR, { title, content });
}

export async function sendError(body: string) {
  await ipcRenderer.invoke(IPC_ACTIONS.SEND_ERROR, body);
}

type IPCRendererListener = Parameters<typeof ipcRenderer.on>[1];
export function registerMainProcessErrorListener(
  listener: IPCRendererListener
) {
  ipcRenderer.on(IPC_CHANNELS.LOG_MAIN_PROCESS_ERROR, listener);
}

export function registerConsoleLogListener(listener: IPCRendererListener) {
  ipcRenderer.on(IPC_CHANNELS.CONSOLE_LOG, listener);
}
