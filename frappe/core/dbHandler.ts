import { DatabaseDemux } from '@/demux/db';
import { Frappe } from 'frappe/core/frappe';
import { DatabaseBase, GetAllOptions } from 'utils/db/types';
import { DocValueMap, RawValueMap } from './types';

export class DatabaseHandler extends DatabaseBase {
  #frappe: Frappe;
  #demux: DatabaseDemux;

  constructor(frappe: Frappe) {
    super();
    this.#frappe = frappe;
    this.#demux = new DatabaseDemux(frappe.isElectron);
  }

  async createNewDatabase(dbPath: string, countryCode?: string) {
    await this.#demux.createNewDatabase(dbPath, countryCode);
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    await this.#demux.connectToDatabase(dbPath, countryCode);
  }

  init() {
    // do nothing
  }

  async insert(
    schemaName: string,
    docValueMap: DocValueMap
  ): Promise<DocValueMap> {
    let rawValueMap = this.toRawValueMap(
      schemaName,
      docValueMap
    ) as RawValueMap;
    rawValueMap = (await this.#demux.call(
      'insert',
      schemaName,
      rawValueMap
    )) as RawValueMap;
    return this.toDocValueMap(schemaName, rawValueMap) as DocValueMap;
  }

  // Read
  async get(
    schemaName: string,
    name: string,
    fields?: string | string[]
  ): Promise<DocValueMap> {
    const rawValueMap = (await this.#demux.call(
      'get',
      schemaName,
      name,
      fields
    )) as RawValueMap;
    return this.toDocValueMap(schemaName, rawValueMap) as DocValueMap;
  }

  async getAll(
    schemaName: string,
    options: GetAllOptions
  ): Promise<DocValueMap[]> {
    const rawValueMap = (await this.#demux.call(
      'getAll',
      schemaName,
      options
    )) as RawValueMap[];

    return this.toDocValueMap(schemaName, rawValueMap) as DocValueMap[];
  }

  async getSingleValues(
    ...fieldnames: ({ fieldname: string; parent?: string } | string)[]
  ): Promise<{ fieldname: string; parent: string; value: unknown }[]> {
    await this.#demux.call('getSingleValues', ...fieldnames);
  }

  // Update
  async rename(
    schemaName: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    await this.#demux.call('rename', schemaName, oldName, newName);
  }

  async update(schemaName: string, docValueMap: DocValueMap): Promise<void> {
    const rawValueMap = this.toRawValueMap(schemaName, docValueMap);
    await this.#demux.call('update', schemaName, rawValueMap);
  }

  // Delete
  async delete(schemaName: string, name: string): Promise<void> {
    await this.#demux.call('delete', schemaName, name);
  }

  // Other
  async close(): Promise<void> {
    await this.#demux.call('close');
  }

  async exists(schemaName: string, name?: string): Promise<boolean> {
    return (await this.#demux.call('exists', schemaName, name)) as boolean;
  }

  toDocValueMap(
    schemaName: string,
    rawValueMap: RawValueMap | RawValueMap[]
  ): DocValueMap | DocValueMap[] {}
  toRawValueMap(
    schemaName: string,
    docValueMap: DocValueMap | DocValueMap[]
  ): RawValueMap | RawValueMap[] {}
}
