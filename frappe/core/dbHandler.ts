import { DatabaseDemux } from '@/demux/db';
import { Frappe } from 'frappe/core/frappe';
import Money from 'pesa/dist/types/src/money';
import { FieldType, FieldTypeEnum, RawValue, SchemaMap } from 'schemas/types';
import { DatabaseBase, GetAllOptions } from 'utils/db/types';
import { DocValue, DocValueMap, RawValueMap, SingleValue } from './types';

export class DatabaseHandler extends DatabaseBase {
  #frappe: Frappe;
  #demux: DatabaseDemux;
  schemaMap: Readonly<SchemaMap> = {};

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

  async init() {
    this.schemaMap = (await this.#demux.getSchemaMap()) as Readonly<SchemaMap>;
  }

  async insert(
    schemaName: string,
    docValueMap: DocValueMap
  ): Promise<DocValueMap> {
    let rawValueMap = this.#toRawValueMap(
      schemaName,
      docValueMap
    ) as RawValueMap;
    rawValueMap = (await this.#demux.call(
      'insert',
      schemaName,
      rawValueMap
    )) as RawValueMap;
    return this.#toDocValueMap(schemaName, rawValueMap) as DocValueMap;
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
    return this.#toDocValueMap(schemaName, rawValueMap) as DocValueMap;
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

    return this.#toDocValueMap(schemaName, rawValueMap) as DocValueMap[];
  }

  async getSingleValues(
    ...fieldnames: ({ fieldname: string; parent?: string } | string)[]
  ): Promise<SingleValue<DocValue>> {
    const rawSingleValue = (await this.#demux.call(
      'getSingleValues',
      ...fieldnames
    )) as SingleValue<RawValue>;

    // TODO: Complete this
    throw new Error('Not implemented');
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
    const rawValueMap = this.#toRawValueMap(schemaName, docValueMap);
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

  #toDocValueMap(
    schemaName: string,
    rawValueMap: RawValueMap | RawValueMap[]
  ): DocValueMap | DocValueMap[] {
    // TODO: Complete this
    throw new Error('Not implemented');
  }
  #toRawValueMap(
    schemaName: string,
    docValueMap: DocValueMap | DocValueMap[]
  ): RawValueMap | RawValueMap[] {
    // TODO: Complete this
    throw new Error('Not implemented');
  }

  #toDocValue(value: RawValue, fieldtype: FieldType): DocValue {
    switch (fieldtype) {
      case FieldTypeEnum.Currency:
        return this.#frappe.pesa((value ?? 0) as string | number);
      case FieldTypeEnum.Date:
        return new Date(value as string);
      case FieldTypeEnum.Datetime:
        return new Date(value as string);
      case FieldTypeEnum.Int:
        return +(value as string | number);
      case FieldTypeEnum.Float:
        return +(value as string | number);
      case FieldTypeEnum.Check:
        return Boolean(value as number);
      default:
        return String(value);
    }
  }

  #toRawValue(value: DocValue, fieldtype: FieldType): RawValue {
    switch (fieldtype) {
      case FieldTypeEnum.Currency:
        return (value as Money).store;
      case FieldTypeEnum.Date:
        return (value as Date).toISOString().split('T')[0];
      case FieldTypeEnum.Datetime:
        return (value as Date).toISOString();
      case FieldTypeEnum.Int: {
        if (typeof value === 'string') {
          return parseInt(value);
        }

        return Math.floor(value as number);
      }
      case FieldTypeEnum.Float: {
        if (typeof value === 'string') {
          return parseFloat(value);
        }

        return value as number;
      }
      case FieldTypeEnum.Check:
        return Number(value);
      default:
        return String(value);
    }
  }
}
