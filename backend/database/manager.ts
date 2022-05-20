import { constants } from 'fs';
import fs from 'fs/promises';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { getSchemas } from '../../schemas';
import { databaseMethodSet } from '../helpers';
import patches from '../patches';
import { BespokeQueries } from './bespoke';
import DatabaseCore from './core';
import { runPatches } from './runPatch';
import { BespokeFunction, Patch } from './types';

export class DatabaseManager extends DatabaseDemuxBase {
  db?: DatabaseCore;

  get #isInitialized(): boolean {
    return this.db !== undefined && this.db.knex !== undefined;
  }

  getSchemaMap() {
    return this.db?.schemaMap ?? {};
  }

  async createNewDatabase(dbPath: string, countryCode: string) {
    await this.#unlinkIfExists(dbPath);
    return await this.connectToDatabase(dbPath, countryCode);
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    countryCode ??= await DatabaseCore.getCountryCode(dbPath);

    this.db = new DatabaseCore(dbPath);
    await this.db.connect();

    const schemaMap = getSchemas(countryCode);
    this.db.setSchemaMap(schemaMap);

    await this.#migrate();
    return countryCode;
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
      return;
    }

    // @ts-ignore
    const queryFunction: BespokeFunction = BespokeQueries[method];
    return await queryFunction(this.db!, ...args);
  }

  async #migrate(): Promise<void> {
    if (!this.#isInitialized) {
      return;
    }

    const isFirstRun = await this.#getIsFirstRun();
    if (isFirstRun) {
      await this.db!.migrate();
    }

    const patchesToExecute = await this.#getPatchesToExecute();
    const preMigrationPatches = patchesToExecute.filter(
      (p) => p.patch.beforeMigrate
    );
    const postMigrationPatches = patchesToExecute.filter(
      (p) => !p.patch.beforeMigrate
    );

    await runPatches(preMigrationPatches, this);
    await this.db!.migrate();
    await runPatches(postMigrationPatches, this);
  }

  async #getPatchesToExecute(): Promise<Patch[]> {
    if (this.db === undefined) {
      return [];
    }

    const query: { name: string }[] = await this.db.knex!('PatchRun').select(
      'name'
    );
    const executedPatches = query.map((q) => q.name);
    return patches.filter((p) => !executedPatches.includes(p.name));
  }

  async #unlinkIfExists(dbPath: string) {
    const exists = await fs
      .access(dbPath, constants.W_OK)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      fs.unlink(dbPath);
    }
  }

  async #getIsFirstRun(): Promise<boolean> {
    if (!this.#isInitialized) {
      return true;
    }

    const tableList: unknown[] = await this.db!.knex!.raw(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    return tableList.length === 0;
  }
}

export default new DatabaseManager();
