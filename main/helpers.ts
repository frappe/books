import { constants } from 'fs';
import fs from 'fs/promises';
import { ConfigFile } from 'fyo/core/types';
import { Main } from 'main';
import config from 'utils/config';
import { BackendResponse } from 'utils/ipc/types';
import { IPC_CHANNELS } from 'utils/messages';
import AdmZip from 'adm-zip';
import type { ConfigFilesWithModified, PluginInfo } from 'utils/types';
import { app } from 'electron';
import path from 'path';

export async function setAndGetCleanedConfigFiles() {
  const files = config.get('files', []);

  const cleanedFileMap: Map<string, ConfigFile> = new Map();
  for (const file of files) {
    const exists = await fs
      .access(file.dbPath, constants.W_OK)
      .then(() => true)
      .catch(() => false);

    if (!file.companyName) {
      continue;
    }

    const key = `${file.companyName}-${file.dbPath}`;
    if (!exists || cleanedFileMap.has(key)) {
      continue;
    }

    cleanedFileMap.set(key, file);
  }

  const cleanedFiles = Array.from(cleanedFileMap.values());
  config.set('files', cleanedFiles);
  return cleanedFiles;
}

export async function getConfigFilesWithModified(files: ConfigFile[]) {
  const filesWithModified: ConfigFilesWithModified[] = [];
  for (const { dbPath, id, companyName, openCount } of files) {
    const { mtime } = await fs.stat(dbPath);
    filesWithModified.push({
      id,
      dbPath,
      companyName,
      modified: mtime.toISOString(),
      openCount,
    });
  }

  return filesWithModified;
}

export async function getErrorHandledReponse(
  func: () => Promise<unknown> | unknown
) {
  const response: BackendResponse = {};

  try {
    response.data = await func();
  } catch (err) {
    response.error = {
      name: (err as NodeJS.ErrnoException).name,
      message: (err as NodeJS.ErrnoException).message,
      stack: (err as NodeJS.ErrnoException).stack,
      code: (err as NodeJS.ErrnoException).code,
    };
  }

  return response;
}

export function rendererLog(main: Main, ...args: unknown[]) {
  main.mainWindow?.webContents.send(IPC_CHANNELS.CONSOLE_LOG, ...args);
}

export function isNetworkError(error: Error) {
  switch (error?.message) {
    case 'net::ERR_INTERNET_DISCONNECTED':
    case 'net::ERR_NETWORK_CHANGED':
    case 'net::ERR_PROXY_CONNECTION_FAILED':
    case 'net::ERR_CONNECTION_RESET':
    case 'net::ERR_CONNECTION_CLOSE':
    case 'net::ERR_NAME_NOT_RESOLVED':
    case 'net::ERR_TIMED_OUT':
    case 'net::ERR_CONNECTION_TIMED_OUT':
      return true;
    default:
      return false;
  }
}

export function unzipFile(filePath: string, destPath: string) {
  const zip = new AdmZip(filePath);
  zip.extractAllTo(destPath, true);
}

export function getInfoJsonFromZip(filePath: string) {
  const zip = new AdmZip(filePath);
  const entry = zip.getEntry('info.json');
  if (!entry) {
    return;
  }

  const data = entry.getData();
  return JSON.parse(data.toString('utf-8')) as PluginInfo;
}

export function getPluginFolderNameFromInfo({ name, version }: PluginInfo) {
  return `${name.replaceAll(' ', '')}-${version}`;
}

export function getAppPath(main: Main) {
  let root = app.getPath('documents');
  if (main.isDevelopment) {
    root = 'dbs';
  }

  return path.join(root, 'Frappe Books');
}
