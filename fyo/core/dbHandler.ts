import { SingleValue } from 'backend/database/types';
import { Fyo } from 'fyo';
import { DatabaseDemux } from 'fyo/demux/db';
import { ValueError } from 'fyo/utils/errors';
import Observable from 'fyo/utils/observable';
import { translateSchema } from 'fyo/utils/translation';
import { Field, RawValue, SchemaMap } from 'schemas/types';
import { getMapFromList } from 'utils';
import {
  DatabaseBase,
  DatabaseDemuxBase,
  GetAllOptions,
  QueryFilter,
} from 'utils/db/types';
import { schemaTranslateables } from 'utils/translationHelpers';
import { LanguageMap } from 'utils/types';
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
type Cashflow = { inflow: number; outflow: number; yearmonth: string }[];
type Balance = { balance: number; yearmonth: string }[];
type IncomeExpense = { income: Balance; expense: Balance };
type TotalCreditAndDebit = {
  account: string;
  totalCredit: number;
  totalDebit: number;
};
type FieldMap = Record<string, Record<string, Field>>;

export class DatabaseHandler extends DatabaseBase {
  #fyo: Fyo;
  converter: Converter;
  #demux: DatabaseDemuxBase;
  dbPath?: string;
  #schemaMap: SchemaMap = {};
  #fieldMap: FieldMap = {};
  observer: Observable<never> = new Observable();

  constructor(fyo: Fyo, Demux?: DatabaseDemuxConstructor) {
    super();
    this.#fyo = fyo;
    this.converter = new Converter(this, this.#fyo);

    if (Demux !== undefined) {
      this.#demux = new Demux(fyo.isElectron);
    } else {
      this.#demux = new DatabaseDemux(fyo.isElectron);
    }
  }

  get schemaMap(): Readonly<SchemaMap> {
    return this.#schemaMap;
  }

  get fieldMap(): Readonly<FieldMap> {
    return this.#fieldMap;
  }

  get isConnected() {
    return !!this.dbPath;
  }

  async createNewDatabase(dbPath: string, countryCode: string) {
    countryCode = await this.#demux.createNewDatabase(dbPath, countryCode);
    await this.init();
    this.dbPath = dbPath;
    return countryCode;
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    countryCode = await this.#demux.connectToDatabase(dbPath, countryCode);
    await this.init();
    this.dbPath = dbPath;
    return countryCode;
  }

  async init() {
    this.#schemaMap = (await this.#demux.getSchemaMap()) as SchemaMap;
    this.#setFieldMap();
    this.observer = new Observable();
  }

  async translateSchemaMap(languageMap?: LanguageMap) {
    if (languageMap) {
      translateSchema(this.#schemaMap, languageMap, schemaTranslateables);
    } else {
      this.#schemaMap = (await this.#demux.getSchemaMap()) as SchemaMap;
      this.#setFieldMap();
    }
  }

  async purgeCache() {
    await this.close();
    this.dbPath = undefined;
    this.#schemaMap = {};
    this.#fieldMap = {};
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
    this.observer.trigger(`insert:${schemaName}`, docValueMap);
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
    this.observer.trigger(`get:${schemaName}`, { name, fields });
    return this.converter.toDocValueMap(schemaName, rawValueMap) as DocValueMap;
  }

  async getAll(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<DocValueMap[]> {
    const rawValueMap = await this.#getAll(schemaName, options);
    this.observer.trigger(`getAll:${schemaName}`, options);
    return this.converter.toDocValueMap(
      schemaName,
      rawValueMap
    ) as DocValueMap[];
  }

  async getAllRaw(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<RawValueMap[]> {
    const all = await this.#getAll(schemaName, options);
    this.observer.trigger(`getAllRaw:${schemaName}`, options);
    return all;
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
      const field = this.fieldMap[sv.parent][sv.fieldname];
      const value = Converter.toDocValue(sv.value, field, this.#fyo);

      docSingleValue.push({
        value,
        parent: sv.parent,
        fieldname: sv.fieldname,
      });
    }

    this.observer.trigger(`getSingleValues`, fieldnames);
    return docSingleValue;
  }

  async count(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<number> {
    const rawValueMap = await this.#getAll(schemaName, options);
    const count = rawValueMap.length;
    this.observer.trigger(`count:${schemaName}`, options);
    return count;
  }

  // Update
  async rename(
    schemaName: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    await this.#demux.call('rename', schemaName, oldName, newName);
    this.observer.trigger(`rename:${schemaName}`, { oldName, newName });
  }

  async update(schemaName: string, docValueMap: DocValueMap): Promise<void> {
    const rawValueMap = this.converter.toRawValueMap(schemaName, docValueMap);
    await this.#demux.call('update', schemaName, rawValueMap);
    this.observer.trigger(`update:${schemaName}`, docValueMap);
  }

  // Delete
  async delete(schemaName: string, name: string): Promise<void> {
    await this.#demux.call('delete', schemaName, name);
    this.observer.trigger(`delete:${schemaName}`, name);
  }

  async deleteAll(schemaName: string, filters: QueryFilter): Promise<number> {
    const count = (await this.#demux.call(
      'deleteAll',
      schemaName,
      filters
    )) as number;
    this.observer.trigger(`deleteAll:${schemaName}`, filters);
    return count;
  }

  // Other
  async exists(schemaName: string, name?: string): Promise<boolean> {
    const doesExist = (await this.#demux.call(
      'exists',
      schemaName,
      name
    )) as boolean;
    this.observer.trigger(`exists:${schemaName}`, name);
    return doesExist;
  }

  async close(): Promise<void> {
    await this.#demux.call('close');
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

  async getLastInserted(schemaName: string): Promise<number> {
    if (this.schemaMap[schemaName]?.naming !== 'autoincrement') {
      throw new ValueError(
        `invalid schema, ${schemaName} does not have autoincrement naming`
      );
    }

    return (await this.#demux.callBespoke(
      'getLastInserted',
      schemaName
    )) as number;
  }

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

  async getIncomeAndExpenses(
    fromDate: string,
    toDate: string
  ): Promise<IncomeExpense> {
    return (await this.#demux.callBespoke(
      'getIncomeAndExpenses',
      fromDate,
      toDate
    )) as IncomeExpense;
  }

  async getTotalCreditAndDebit(): Promise<unknown> {
    return (await this.#demux.callBespoke(
      'getTotalCreditAndDebit'
    )) as TotalCreditAndDebit[];
  }

  async getStockQuantity(
    item: string,
    location?: string,
    fromDate?: string,
    toDate?: string,
    batch?: string
  ): Promise<number | null> {
    return (await this.#demux.callBespoke(
      'getStockQuantity',
      item,
      location,
      fromDate,
      toDate,
      batch
    )) as number | null;
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

  #setFieldMap() {
    this.#fieldMap = Object.values(this.schemaMap).reduce((acc, sch) => {
      if (!sch?.name) {
        return acc;
      }

      acc[sch?.name] = getMapFromList(sch?.fields, 'fieldname');
      return acc;
    }, {} as FieldMap);
  }
}
