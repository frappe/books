import { constants } from 'fs';
import fs from 'fs/promises';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import config from 'utils/config';

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
  for (const { dbPath, id, companyName } of files) {
    const { mtime } = await fs.stat(dbPath);
    filesWithModified.push({
      id,
      dbPath,
      companyName,
      modified: mtime.toISOString(),
    });
  }

  return filesWithModified;
}
