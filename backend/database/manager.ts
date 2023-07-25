import BetterSQLite3 from 'better-sqlite3';
import fs from 'fs-extra';
import { DatabaseError } from 'fyo/utils/errors';
import path from 'path';
import { SchemaStub } from 'schemas/types';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { getMapFromList } from 'utils/index';
import { Version } from 'utils/version';
import { getSchemas } from '../../schemas';
import { databaseMethodSet, unlinkIfExists } from '../helpers';
import patches from '../patches';
import { BespokeQueries } from './bespoke';
import DatabaseCore from './core';
import {
  executeFirstMigration,
  getPluginConfig,
  getPluginInfoList,
  unzipPluginsIfDoesNotExist,
} from './helpers';
import { runPatches } from './runPatch';
import { BespokeFunction, Patch, PluginConfig } from './types';

export class DatabaseManager extends DatabaseDemuxBase {
  db?: DatabaseCore;
  plugins: PluginConfig[] = [];
  rawPluginSchemaList?: SchemaStub[];

  get #isInitialized(): boolean {
    return this.db !== undefined && this.db.knex !== undefined;
  }

  getSchemaMap() {
    if (this.#isInitialized) {
      return this.db?.schemaMap ?? getSchemas('-', this.rawPluginSchemaList);
    }

    return getSchemas('-', this.rawPluginSchemaList);
  }

  async createNewDatabase(dbPath: string, countryCode: string) {
    await unlinkIfExists(dbPath);
    return await this.connectToDatabase(dbPath, countryCode);
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    return await this.#connect(dbPath, countryCode);
  }

  async #connect(dbPath: string, countryCode?: string) {
    countryCode ??= await DatabaseCore.getCountryCode(dbPath);
    this.db = new DatabaseCore(dbPath);
    await this.db.connect();
    if (!this.db.knex) {
      throw new DatabaseError('Database not connected');
    }

    await executeFirstMigration(this.db, countryCode);
    await this.initializePlugins();
    const schemaMap = getSchemas(countryCode, this.rawPluginSchemaList);
    this.db.setSchemaMap(schemaMap);

    await this.#executeMigration();
    return countryCode;
  }

  async initializePlugins() {
    if (!this.db?.knex) {
      return;
    }

    const infoList = await getPluginInfoList(this.db.knex);
    await unzipPluginsIfDoesNotExist(this.db.knex, infoList);

    this.plugins = [];
    for (const info of infoList) {
      const config = await getPluginConfig(info);
      this.plugins.push(config);
    }

    this.rawPluginSchemaList = this.plugins.map((p) => p.schemas).flat();
  }

  async #executeMigration() {
    const version = await this.#getAppVersion();
    const patches = await this.#getPatchesToExecute(version);

    const hasPatches = !!patches.pre.length || !!patches.post.length;
    if (hasPatches) {
      await this.#createBackup();
    }

    await runPatches(patches.pre, this, version);
    await this.db!.migrate({
      pre: async () => {
        if (hasPatches) {
          return;
        }

        await this.#createBackup();
      },
    });
    await runPatches(patches.post, this, version);
  }

  async #getPatchesToExecute(
    version: string
  ): Promise<{ pre: Patch[]; post: Patch[] }> {
    if (this.db === undefined) {
      return { pre: [], post: [] };
    }

    const query = (await this.db.knex!('PatchRun').select()) as {
      name: string;
      version?: string;
      failed?: boolean;
    }[];

    const runPatchesMap = getMapFromList(query, 'name');
    /**
     * A patch is run only if:
     * - it hasn't run and was added in a future version
     *    i.e. app version is before patch added version
     * - it ran but failed in some other version (i.e fixed)
     */
    const filtered = patches
      .filter((p) => {
        const exec = runPatchesMap[p.name];
        if (!exec && Version.lte(version, p.version)) {
          return true;
        }

        if (exec?.failed && exec?.version !== version) {
          return true;
        }

        return false;
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return {
      pre: filtered.filter((p) => p.patch.beforeMigrate),
      post: filtered.filter((p) => !p.patch.beforeMigrate),
    };
  }

  async call(method: DatabaseMethod, ...args: unknown[]) {
    if (!this.#isInitialized) {
      return;
    }

    if (!databaseMethodSet.has(method)) {
      return;
    }

    // @ts-ignore
    const response = await this.db[method](...args);
    if (method === 'close') {
      delete this.db;
    }

    return response;
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.#isInitialized) {
      return;
    }

    if (!BespokeQueries.hasOwnProperty(method)) {
      throw new DatabaseError(`invalid bespoke db function ${method}`);
    }

    const queryFunction: BespokeFunction =
      BespokeQueries[method as keyof BespokeFunction];
    return await queryFunction(this.db!, ...args);
  }

  async #createBackup() {
    const { dbPath } = this.db ?? {};
    if (!dbPath || process.env.IS_TEST) {
      return;
    }

    const backupPath = await this.#getBackupFilePath();
    if (!backupPath) {
      return;
    }

    const db = this.getDriver();
    if (!db) {
      return;
    }

    await db.backup(backupPath);
    db.close();
  }

  async #getBackupFilePath() {
    const { dbPath } = this.db ?? {};
    if (dbPath === ':memory:' || !dbPath) {
      return null;
    }

    let fileName = path.parse(dbPath).name;
    if (fileName.endsWith('.books')) {
      fileName = fileName.slice(0, -6);
    }

    const backupFolder = path.join(path.dirname(dbPath), 'backups');
    const date = new Date().toISOString().split('T')[0];
    const version = await this.#getAppVersion();
    const backupFile = `${fileName}_${version}_${date}.books.db`;
    fs.ensureDirSync(backupFolder);
    return path.join(backupFolder, backupFile);
  }

  async #getAppVersion(): Promise<string> {
    const knex = this.db?.knex;
    if (!knex) {
      return '0.0.0';
    }

    const query = await knex('SingleValue')
      .select('value')
      .where({ fieldname: 'version', parent: 'SystemSettings' });
    const value = (query[0] as undefined | { value: string })?.value;
    return value || '0.0.0';
  }

  getDriver() {
    const { dbPath } = this.db ?? {};
    if (!dbPath) {
      return null;
    }

    return BetterSQLite3(dbPath, { readonly: true });
  }
}

export default new DatabaseManager();
