import AdmZip from 'adm-zip';
import { app } from 'electron';
import { constants } from 'fs';
import fs from 'fs-extra';
import { ConfigFile } from 'fyo/core/types';
import type { Knex } from 'knex';
import { Main } from 'main';
import path from 'path';
import type { SchemaStub } from 'schemas/types';
import config from 'utils/config';
import { BackendResponse } from 'utils/ipc/types';
import { IPC_CHANNELS } from 'utils/messages';
import type { ConfigFilesWithModified, PluginInfo } from 'utils/types';

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

export function getPluginFolderNameFromInfo(
  { name, version }: PluginInfo,
  noVersion = false
) {
  const folderPrefix = name.replaceAll(' ', '');
  if (noVersion) {
    return folderPrefix;
  }

  return `${folderPrefix}-${version}`;
}

export function getAppPath(type: 'root' | 'backups' | 'plugins' = 'root') {
  let root = app.getPath('documents');
  if (process.env.NODE_ENV === 'development') {
    root = 'dbs';
  }

  if (type === 'root') {
    return path.join(root, 'Frappe Books');
  }

  return path.join(root, 'Frappe Books', type);
}

export async function unzipPluginsIfDoesNotExist(knex: Knex): Promise<void> {
  const plugins = (await knex('Plugin').select(['name', 'info'])) as {
    name: string;
    info: string;
  }[];

  for (const { name, info: infoString } of plugins) {
    const pluginsRootPath = getAppPath('plugins');
    const info = JSON.parse(infoString) as PluginInfo;
    const folderName = getPluginFolderNameFromInfo(info);
    const pluginPath = path.join(pluginsRootPath, folderName);

    if (fs.existsSync(pluginPath)) {
      continue;
    }

    deletePluginFolder(info);
    fs.ensureDirSync(pluginPath);
    const data = (await knex('Plugin').select('data').where({ name })) as {
      data: string;
    }[];

    const pluginZipBase64 = data[0].data;
    const zipBuffer = Buffer.from(pluginZipBase64, 'base64');
    const pluginFilePath = path.join(pluginPath, `${folderName}.books_plugin`);

    fs.writeFileSync(pluginFilePath, zipBuffer);
    const zip = new AdmZip(pluginFilePath);
    zip.extractAllTo(pluginPath);
  }
}

function deletePluginFolder(info: PluginInfo) {
  const pluginsRootPath = getAppPath('plugins');
  const folderNamePrefix = getPluginFolderNameFromInfo(info, true) + '-';
  for (const folderName of fs.readdirSync(pluginsRootPath)) {
    if (!folderName.startsWith(folderNamePrefix)) {
      continue;
    }

    fs.removeSync(path.join(pluginsRootPath, folderName));
  }
}

export async function getRawPluginSchemaList(): Promise<SchemaStub[]> {
  const pluginsRoot = getAppPath('plugins');
  const schemaStubs: SchemaStub[][] = [];
  for (const pluginFolderName of fs.readdirSync(pluginsRoot)) {
    const pluginPath = path.join(pluginsRoot, pluginFolderName);
    const schemasJs = path.resolve(path.join(pluginPath, 'schemas.js'));
    if (!fs.existsSync(schemasJs)) {
      continue;
    }

    const {
      default: { default: schema },
    } = (await import(schemasJs)) as {
      default: { default: SchemaStub[] };
    };

    schemaStubs.push(schema);
  }

  return schemaStubs.flat();
}
