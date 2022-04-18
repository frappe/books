import { SingleValue } from 'backend/database/types';
import { Frappe } from 'frappe';
import { DatabaseDemux } from 'frappe/demux/db';
import { Field, RawValue, SchemaMap } from 'schemas/types';
import { getMapFromList } from 'utils';
import { DatabaseBase, DatabaseDemuxBase, GetAllOptions } from 'utils/db/types';
import { Converter } from './converter';
import {
  DatabaseDemuxConstructor,
  DocValue,
  DocValueMap,
  RawValueMap,
} from './types';

// Return types of Bespoke Queries
type TopExpenses = { account: string; total: number }[];
type TotalOutstanding = { total: number; outstanding: number };
type Cashflow = { inflow: number; outflow: number; 'month-year': string }[];

export class DatabaseHandler extends DatabaseBase {
  #frappe: Frappe;
  converter: Converter;
  #demux: DatabaseDemuxBase;
  schemaMap: Readonly<SchemaMap> = {};
  fieldValueMap: Record<string, Record<string, Field>> = {};

  constructor(frappe: Frappe, Demux?: DatabaseDemuxConstructor) {
    super();
    this.#frappe = frappe;
    this.converter = new Converter(this, this.#frappe);

    if (Demux !== undefined) {
      this.#demux = new Demux(frappe.isElectron);
    } else {
      this.#demux = new DatabaseDemux(frappe.isElectron);
    }
  }

  async createNewDatabase(dbPath: string, countryCode: string) {
    countryCode = await this.#demux.createNewDatabase(dbPath, countryCode);
    await this.init();
    return countryCode;
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    countryCode = await this.#demux.connectToDatabase(dbPath, countryCode);
    await this.init();
    return countryCode;
  }

  async init() {
    this.schemaMap = (await this.#demux.getSchemaMap()) as Readonly<SchemaMap>;

    for (const schemaName in this.schemaMap) {
      const fields = this.schemaMap[schemaName]!.fields!;
      this.fieldValueMap[schemaName] = getMapFromList(fields, 'fieldname');
    }
  }

  async insert(
    schemaName: string,
    docValueMap: DocValueMap
  ): Promise<DocValueMap> {
    let rawValueMap = this.converter.toRawValueMap(
      schemaName,
      docValueMap
    ) as RawValueMap;
    rawValueMap = (await this.#demux.call(
      'insert',
      schemaName,
      rawValueMap
    )) as RawValueMap;
    return this.converter.toDocValueMap(schemaName, rawValueMap) as DocValueMap;
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
    return this.converter.toDocValueMap(schemaName, rawValueMap) as DocValueMap;
  }

  async getAll(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<DocValueMap[]> {
    const rawValueMap = await this.#getAll(schemaName, options);
    return this.converter.toDocValueMap(
      schemaName,
      rawValueMap
    ) as DocValueMap[];
  }

  async getAllRaw(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<DocValueMap[]> {
    return await this.#getAll(schemaName, options);
  }

  async getSingleValues(
    ...fieldnames: ({ fieldname: string; parent?: string } | string)[]
  ): Promise<SingleValue<DocValue>> {
    const rawSingleValue = (await this.#demux.call(
      'getSingleValues',
      ...fieldnames
    )) as SingleValue<RawValue>;

    const docSingleValue: SingleValue<DocValue> = [];
    for (const sv of rawSingleValue) {
      const fieldtype = this.fieldValueMap[sv.parent][sv.fieldname].fieldtype;
      const value = Converter.toDocValue(sv.value, fieldtype, this.#frappe);

      docSingleValue.push({
        value,
        parent: sv.parent,
        fieldname: sv.fieldname,
      });
    }

    return docSingleValue;
  }

  async count(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<number> {
    const rawValueMap = await this.#getAll(schemaName, options);
    return rawValueMap.length;
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
    const rawValueMap = this.converter.toRawValueMap(schemaName, docValueMap);
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
   * DatabaseCore and require use of knex or raw queries. The output
   * of these is not converted to DocValue and is used as is (RawValue).
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

  /**
   * Internal methods
   */
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
}
