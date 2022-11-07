import fs from 'fs/promises';
import { DatabaseError } from 'fyo/utils/errors';
import path from 'path';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { getSchemas } from '../../schemas';
import {
  databaseMethodSet,
  emitMainProcessError,
  unlinkIfExists
} from '../helpers';
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
    await unlinkIfExists(dbPath);
    return await this.connectToDatabase(dbPath, countryCode);
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    countryCode = await this._connect(dbPath, countryCode);
    await this.#migrate();
    return countryCode;
  }

  async _connect(dbPath: string, countryCode?: string) {
    countryCode ??= await DatabaseCore.getCountryCode(dbPath);
    this.db = new DatabaseCore(dbPath);
    await this.db.connect();
    const schemaMap = getSchemas(countryCode);
    this.db.setSchemaMap(schemaMap);
    return countryCode;
  }

  async #migrate(): Promise<void> {
    if (!this.#isInitialized) {
      return;
    }

    const isFirstRun = await this.#getIsFirstRun();
    if (isFirstRun) {
      await this.db!.migrate();
    }

    /**
     * This needs to be supplimented with transactions
     * TODO: Add transactions in core.ts
     */
    const dbPath = this.db!.dbPath;
    const copyPath = await this.#makeTempCopy();

    try {
      await this.#runPatchesAndMigrate();
    } catch (err) {
      this.#handleFailedMigration(err, dbPath, copyPath);
    } finally {
      await unlinkIfExists(copyPath);
    }
  }

  async #handleFailedMigration(
    error: unknown,
    dbPath: string,
    copyPath: string | null
  ) {
    await this.db!.close();

    if (copyPath) {
      await this.#restoreDbCopy(dbPath, copyPath);
    }

    if (error instanceof Error) {
      error.message = `failed migration\n${error.message}`;
    }

    throw error;
  }

  async #restoreDbCopy(dbPath: string, copyPath: string) {
    try {
      await fs.copyFile(copyPath!, dbPath);
    } catch (err) {
      emitMainProcessError(err);
    }
  }

  async #runPatchesAndMigrate() {
    const patchesToExecute = await this.#getPatchesToExecute();

    patchesToExecute.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
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

    // @ts-ignore
    const queryFunction: BespokeFunction = BespokeQueries[method];
    return await queryFunction(this.db!, ...args);
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

  async #makeTempCopy() {
    const src = this.db!.dbPath;
    if (src === ':memory:') {
      return null;
    }

    const dir = path.parse(src).dir;
    const dest = path.join(dir, '__premigratory_temp.db');

    try {
      await fs.copyFile(src, dest);
    } catch (err) {
      emitMainProcessError(err);
      return null;
    }

    return dest;
  }
}

export default new DatabaseManager();
