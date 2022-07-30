import { constants } from 'fs';
import fs from 'fs/promises';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import { Main } from 'main';
import config from 'utils/config';
import { BackendResponse } from 'utils/ipc/types';
import { IPC_CHANNELS } from 'utils/messages';

interface ConfigFilesWithModified extends ConfigFile {
  modified: string;
}

export async function setAndGetCleanedConfigFiles() {
  const files = config.get(ConfigKeys.Files, []) as ConfigFile[];

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
  config.set(ConfigKeys.Files, cleanedFiles);
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

export async function getErrorHandledReponse(func: () => Promise<unknown>) {
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
