import { Frappe } from 'frappe';
import { DatabaseDemux } from 'frappe/demux/db';
import Money from 'pesa/dist/types/src/money';
import { FieldType, FieldTypeEnum, RawValue, SchemaMap } from 'schemas/types';
import { DatabaseBase, DatabaseDemuxBase, GetAllOptions } from 'utils/db/types';
import {
  DatabaseDemuxConstructor,
  DocValue,
  DocValueMap,
  RawValueMap,
  SingleValue,
} from './types';

// Return types of Bespoke Queries
type TopExpenses = { account: string; total: number }[];
type TotalOutstanding = { total: number; outstanding: number };
type Cashflow = { inflow: number; outflow: number; 'month-year': string }[];

export class DatabaseHandler extends DatabaseBase {
  #frappe: Frappe;
  #demux: DatabaseDemuxBase;
  schemaMap: Readonly<SchemaMap> = {};

  constructor(frappe: Frappe, Demux?: DatabaseDemuxConstructor) {
    super();
    this.#frappe = frappe;

    if (Demux !== undefined) {
      this.#demux = new Demux(frappe.isElectron);
    } else {
      this.#demux = new DatabaseDemux(frappe.isElectron);
    }
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
    options: GetAllOptions = {}
  ): Promise<DocValueMap[]> {
    const rawValueMap = await this.#getAll(schemaName, options);
    return this.#toDocValueMap(schemaName, rawValueMap) as DocValueMap[];
  }

  async getAllRaw(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<DocValueMap[]> {
    return await this.#getAll(schemaName, options);
  }

  async count(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<number> {
    const rawValueMap = await this.#getAll(schemaName, options);
    return rawValueMap.length;
  }

  async #getAll(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<RawValueMap[]> {
    return (await this.#demux.call(
      'getAll',
      schemaName,
      options
    )) as RawValueMap[];
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

  /**
   * Bespoke function
   *
   * These are functions to run custom queries that are too complex for
   * DatabaseCore and require use of knex or raw queries.
   *
   * The query logic for these is in backend/database/bespoke.ts
   */
  async getTopExpenses(fromDate: string, toDate: string): Promise<TopExpenses> {
    return (await this.#demux.callBespoke(
      'getTopExpenses',
      fromDate,
      toDate
    )) as TopExpenses;
  }

  async getTotalOutstanding(
    schemaName: string,
    fromDate: string,
    toDate: string
  ): Promise<TotalOutstanding> {
    return (await this.#demux.callBespoke(
      'getTotalOutstanding',
      schemaName,
      fromDate,
      toDate
    )) as TotalOutstanding;
  }

  async getCashflow(fromDate: string, toDate: string): Promise<Cashflow> {
    return (await this.#demux.callBespoke(
      'getCashflow',
      fromDate,
      toDate
    )) as Cashflow;
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
