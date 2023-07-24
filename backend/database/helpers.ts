import AdmZip from 'adm-zip';
import { getAppPath, getPluginFolderNameFromInfo } from 'backend/helpers';
import fs from 'fs-extra';
import { DatabaseError } from 'fyo/utils/errors';
import type { Knex } from 'knex';
import path from 'path';
import { getSchemas } from 'schemas/index';
import { SchemaStub } from 'schemas/types';
import { PluginInfo } from 'utils/types';
import type DatabaseCore from './core';
import { PluginConfig } from './types';

export async function executeFirstMigration(
  db: DatabaseCore,
  countryCode: string
) {
  if (!db.knex) {
    throw new DatabaseError('Database not initialized');
  }

  const isFirstRun = await getIsFirstRun(db.knex);
  if (!isFirstRun) {
    return;
  }

  const schemas = getSchemas(countryCode);
  db.setSchemaMap(schemas);
  await db.migrate();
}

export async function getIsFirstRun(knex: Knex): Promise<boolean> {
  const query = await knex('sqlite_master').where({
    type: 'table',
    name: 'PatchRun',
  });
  return !query.length;
}

export async function getPluginInfoList(knex: Knex): Promise<PluginInfo[]> {
  let plugins: { info: string }[];
  try {
    plugins = (await knex('Plugin').select(['info'])) as {
      info: string;
    }[];
  } catch {
    return [];
  }

  return plugins.map(({ info }) => JSON.parse(info) as PluginInfo);
}

export async function unzipPluginsIfDoesNotExist(
  knex: Knex,
  infoList: PluginInfo[]
): Promise<void> {
  for (const info of infoList) {
    const pluginsRootPath = getAppPath('plugins');
    const folderName = getPluginFolderNameFromInfo(info);
    const pluginPath = path.join(pluginsRootPath, folderName);

    if (fs.existsSync(pluginPath)) {
      continue;
    }

    deletePluginFolder(info);
    fs.ensureDirSync(pluginPath);
    const data = (await knex('Plugin')
      .select('data')
      .where({ name: info.name })) as {
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
  let folderNames: string[] = [];
  try {
    folderNames = fs.readdirSync(pluginsRootPath);
  } catch {}

  for (const folderName of folderNames) {
    if (!folderName.startsWith(folderNamePrefix)) {
      continue;
    }

    fs.removeSync(path.join(pluginsRootPath, folderName));
  }
}

export async function getPluginConfig(info: PluginInfo): Promise<PluginConfig> {
  const folderName = getPluginFolderNameFromInfo(info);
  const pluginRoot = path.join(getAppPath('plugins'), folderName);

  const config: PluginConfig = {
    info,
    schemas: [],
    paths: {
      folderName,
      root: pluginRoot,
    },
  };

  const schemasPath = path.resolve(pluginRoot, 'schemas.js');
  if (fs.existsSync(schemasPath)) {
    config.paths.schemas = schemasPath;
    config.schemas = await importSchemas(schemasPath);
  }

  const modelsPath = path.resolve(pluginRoot, 'models.js');
  if (fs.existsSync(schemasPath)) {
    config.paths.models = modelsPath;
  }

  return config;
}

async function importSchemas(schemasPath: string): Promise<SchemaStub[]> {
  try {
    const {
      default: { default: exportedSchemas },
    } = (await import(schemasPath)) as {
      default: { default: unknown };
    };

    if (isSchemaStubList(exportedSchemas)) {
      return exportedSchemas;
    }
  } catch {}

  return [];
}

function isSchemaStubList(schemas: unknown): schemas is SchemaStub[] {
  if (!Array.isArray(schemas)) {
    return false;
  }

  return schemas.every(
    (sch) =>
      typeof sch === 'object' && typeof (sch as SchemaStub)?.name === 'string'
  );
}
