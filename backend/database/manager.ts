import fs from 'fs/promises';
import { getSchemas } from '../../schemas';
import patches from '../patches';
import DatabaseCore from './core';
import { runPatches } from './runPatch';
import { Patch } from './types';

export class DatabaseManager {
  db?: DatabaseCore;
  constructor() {}

  async createNewDatabase(dbPath: string, countryCode: string) {
    await this.#unlinkIfExists(dbPath);
    this.connectToDatabase(dbPath, countryCode);
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    this.db = new DatabaseCore(dbPath);
    this.db.connect();

    countryCode ??= await this.#getCountryCode();
    const schemaMap = getSchemas(countryCode);
    this.db.setSchemaMap(schemaMap);

    await this.migrate();
  }

  async migrate() {
    if (this.db === undefined) {
      return;
    }

    const patchesToExecute = await this.#getPatchesToExecute();
    const preMigrationPatches = patchesToExecute.filter(
      (p) => p.patch.beforeMigrate
    );
    const postMigrationPatches = patchesToExecute.filter(
      (p) => !p.patch.beforeMigrate
    );

    await runPatches(preMigrationPatches, this);
    await this.db.migrate();
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

  async #getCountryCode(): Promise<string | undefined> {
    if (this.db === undefined) {
      return undefined;
    }

    const query = await this.db.knex!('SingleValue').where({
      fieldname: 'countryCode',
      parent: 'SystemSettings',
    });

    if (query.length > 0) {
      return query[0].countryCode as string;
    }

    return undefined;
  }

  async #unlinkIfExists(dbPath: string) {
    try {
      fs.unlink(dbPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }

      throw err;
    }
  }
}

export default new DatabaseManager();
