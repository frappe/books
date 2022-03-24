import { knex, Knex } from 'knex';
import { getRandomString } from '../../frappe/utils';
import CacheManager from '../../frappe/utils/cacheManager';
import {
  CannotCommitError,
  DatabaseError,
  DuplicateEntryError,
  LinkValidationError,
  NotFoundError,
  ValueError,
} from '../../frappe/utils/errors';
import {
  Field,
  FieldTypeEnum,
  RawValue,
  SchemaMap,
  TargetField,
} from '../../schemas/types';
import { getFieldsByType, sqliteTypeMap } from '../common';
import {
  ColumnDiff,
  FieldValueMap,
  GetAllOptions,
  GetQueryBuilderOptions,
  QueryFilter,
} from './types';

export default class Database {
  knex: Knex;
  cache: CacheManager;
  typeMap = sqliteTypeMap;
  dbPath: string;
  schemaMap: SchemaMap;
  connectionParams: Knex.Config;

  constructor(dbPath: string, schemaMap: SchemaMap) {
    this.schemaMap = schemaMap;
    this.cache = new CacheManager();
    this.dbPath = dbPath;
    this.connectionParams = {
      client: 'sqlite3',
      connection: {
        filename: this.dbPath,
      },
      pool: {
        afterCreate(conn, done) {
          conn.run('PRAGMA foreign_keys=ON');
          done();
        },
      },
      useNullAsDefault: true,
      asyncStackTraces: process.env.NODE_ENV === 'development',
    };
  }

  connect() {
    this.knex = knex(this.connectionParams);
    this.knex.on('query-error', (error) => {
      error.type = this.getError(error);
    });
  }

  close() {
    this.knex.destroy();
  }

  async tableExists(schemaName: string) {
    return await this.knex.schema.hasTable(schemaName);
  }

  async singleExists(singleSchemaName: string) {
    const res = await this.knex('SingleValue')
      .count('parent as count')
      .where('parent', singleSchemaName)
      .first();
    return res.count > 0;
  }

  async removeColumns(schemaName: string, targetColumns: string[]) {
    // TODO: Implement this for sqlite
  }

  async deleteSingleValues(singleSchemaName: string) {
    return await this.knex('SingleValue')
      .where('parent', singleSchemaName)
      .delete();
  }

  async sql(query: string, params: Knex.RawBinding[] = []) {
    return await this.knex.raw(query, params);
  }

  async commit() {
    try {
      await this.sql('commit');
    } catch (e) {
      if (e.type !== CannotCommitError) {
        throw e;
      }
    }
  }

  getError(err: Error) {
    let errorType = DatabaseError;
    if (err.message.includes('SQLITE_ERROR: no such table')) {
      errorType = NotFoundError;
    }
    if (err.message.includes('FOREIGN KEY')) {
      errorType = LinkValidationError;
    }
    if (err.message.includes('SQLITE_ERROR: cannot commit')) {
      errorType = CannotCommitError;
    }
    if (err.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed:')) {
      errorType = DuplicateEntryError;
    }
    return errorType;
  }

  async prestigeTheTable(schemaName: string, tableRows: FieldValueMap[]) {
    const max = 200;

    // Alter table hacx for sqlite in case of schema change.
    const tempName = `__${schemaName}`;
    await this.knex.schema.dropTableIfExists(tempName);

    await this.knex.raw('PRAGMA foreign_keys=OFF');
    await this.createTable(schemaName, tempName);

    if (tableRows.length > 200) {
      const fi = Math.floor(tableRows.length / max);
      for (let i = 0; i <= fi; i++) {
        const rowSlice = tableRows.slice(i * max, i + 1 * max);
        if (rowSlice.length === 0) {
          break;
        }
        await this.knex.batchInsert(tempName, rowSlice);
      }
    } else {
      await this.knex.batchInsert(tempName, tableRows);
    }

    await this.knex.schema.dropTable(schemaName);
    await this.knex.schema.renameTable(tempName, schemaName);
    await this.knex.raw('PRAGMA foreign_keys=ON');
  }

  async getTableColumns(schemaName: string): Promise<string[]> {
    const info = await this.sql(`PRAGMA table_info(${schemaName})`);
    return info.map((d) => d.name);
  }

  async getForeignKeys(schemaName: string): Promise<string[]> {
    const foreignKeyList = await this.sql(
      `PRAGMA foreign_key_list(${schemaName})`
    );
    return foreignKeyList.map((d) => d.from);
  }

  getQueryBuilder(
    schemaName: string,
    fields: string[],
    filters: QueryFilter,
    options: GetQueryBuilderOptions
  ): Knex.QueryBuilder {
    const builder = this.knex.select(fields).from(schemaName);

    this.applyFiltersToBuilder(builder, filters);

    if (options.orderBy) {
      builder.orderBy(options.orderBy, options.order);
    }

    if (options.groupBy) {
      builder.groupBy(options.groupBy);
    }

    if (options.offset) {
      builder.offset(options.offset);
    }

    if (options.limit) {
      builder.limit(options.limit);
    }

    return builder;
  }

  applyFiltersToBuilder(builder: Knex.QueryBuilder, filters: QueryFilter) {
    // {"status": "Open"} => `status = "Open"`

    // {"status": "Open", "name": ["like", "apple%"]}
    // => `status="Open" and name like "apple%"

    // {"date": [">=", "2017-09-09", "<=", "2017-11-01"]}
    // => `date >= 2017-09-09 and date <= 2017-11-01`

    const filtersArray = [];

    for (const field in filters) {
      const value = filters[field];
      let operator = '=';
      let comparisonValue = value;

      if (Array.isArray(value)) {
        operator = value[0];
        comparisonValue = value[1];
        operator = operator.toLowerCase();

        if (operator === 'includes') {
          operator = 'like';
        }

        if (operator === 'like' && !comparisonValue.includes('%')) {
          comparisonValue = `%${comparisonValue}%`;
        }
      }

      filtersArray.push([field, operator, comparisonValue]);

      if (Array.isArray(value) && value.length > 2) {
        // multiple conditions
        const operator = value[2];
        const comparisonValue = value[3];
        filtersArray.push([field, operator, comparisonValue]);
      }
    }

    filtersArray.map((filter) => {
      const [field, operator, comparisonValue] = filter;
      if (operator === '=') {
        builder.where(field, comparisonValue);
      } else {
        builder.where(field, operator, comparisonValue);
      }
    });
  }

  async getColumnDiff(schemaName: string): Promise<ColumnDiff> {
    const tableColumns = await this.getTableColumns(schemaName);
    const validFields = this.schemaMap[schemaName].fields;
    const diff: ColumnDiff = { added: [], removed: [] };

    for (const field of validFields) {
      if (
        !tableColumns.includes(field.fieldname) &&
        this.typeMap[field.fieldtype]
      ) {
        diff.added.push(field);
      }
    }

    const validFieldNames = validFields.map((field) => field.fieldname);
    for (const column of tableColumns) {
      if (!validFieldNames.includes(column)) {
        diff.removed.push(column);
      }
    }

    return diff;
  }

  async getNewForeignKeys(schemaName): Promise<Field[]> {
    const foreignKeys = await this.getForeignKeys(schemaName);
    const newForeignKeys: Field[] = [];
    const schema = this.schemaMap[schemaName];
    for (const field of schema.fields) {
      if (
        field.fieldtype === 'Link' &&
        !foreignKeys.includes(field.fieldname)
      ) {
        newForeignKeys.push(field);
      }
    }
    return newForeignKeys;
  }

  buildColumnForTable(table: Knex.AlterTableBuilder, field: Field) {
    if (field.fieldtype === FieldTypeEnum.Table) {
      // In case columnType is "Table"
      // childTable links are handled using the childTable's "parent" field
      return;
    }

    const columnType = this.typeMap[field.fieldtype];
    if (!columnType) {
      return;
    }

    const column = table[columnType](field.fieldname);

    // primary key
    if (field.fieldname === 'name') {
      column.primary();
    }

    // iefault value
    if (field.default !== undefined) {
      column.defaultTo(field.default);
    }

    // required
    if (field.required || field.fieldtype === 'Currency') {
      column.notNullable();
    }

    // link
    if (field.fieldtype === 'Link' && (field as TargetField).target) {
      const targetschemaName = (field as TargetField).target as string;
      const schema = this.schemaMap[targetschemaName];
      table
        .foreign(field.fieldname)
        .references('name')
        .inTable(schema.name)
        .onUpdate('CASCADE')
        .onDelete('RESTRICT');
    }
  }

  async alterTable(schemaName: string) {
    // get columns
    const diff: ColumnDiff = await this.getColumnDiff(schemaName);
    const newForeignKeys: Field[] = await this.getNewForeignKeys(schemaName);

    return this.knex.schema
      .table(schemaName, (table) => {
        if (diff.added.length) {
          for (const field of diff.added) {
            this.buildColumnForTable(table, field);
          }
        }

        if (diff.removed.length) {
          this.removeColumns(schemaName, diff.removed);
        }
      })
      .then(() => {
        if (newForeignKeys.length) {
          return this.addForeignKeys(schemaName, newForeignKeys);
        }
      });
  }

  async createTable(schemaName: string, tableName?: string) {
    tableName ??= schemaName;
    const fields = this.schemaMap[schemaName].fields;
    return await this.runCreateTableQuery(tableName, fields);
  }

  runCreateTableQuery(schemaName: string, fields: Field[]) {
    return this.knex.schema.createTable(schemaName, (table) => {
      for (const field of fields) {
        this.buildColumnForTable(table, field);
      }
    });
  }

  async getNonExtantSingleValues(singleSchemaName: string) {
    const existingFields = (
      await this.knex('SingleValue')
        .where({ parent: singleSchemaName })
        .select('fieldname')
    ).map(({ fieldname }) => fieldname);

    return this.schemaMap[singleSchemaName].fields
      .map(({ fieldname, default: value }) => ({
        fieldname,
        value: value as RawValue | undefined,
      }))
      .filter(
        ({ fieldname, value }) =>
          !existingFields.includes(fieldname) && value !== undefined
      );
  }

  async delete(schemaName: string, name: string) {
    await this.deleteOne(schemaName, name);

    // delete children
    const tableFields = getFieldsByType(
      schemaName,
      this.schemaMap,
      FieldTypeEnum.Table
    ) as TargetField[];

    for (const field of tableFields) {
      await this.deleteChildren(field.target, name);
    }
  }

  async deleteMany(schemaName: string, names: string[]) {
    for (const name of names) {
      await this.delete(schemaName, name);
    }
  }

  async deleteOne(schemaName: string, name: string) {
    return this.knex(schemaName)
      .where('name', name)
      .delete()
      .then(() => {
        this.clearValueCache(schemaName, name);
      });
  }

  deleteChildren(schemaName: string, parentName: string) {
    return this.knex(schemaName).where('parent', parentName).delete();
  }

  runDeleteOtherChildren(
    field: TargetField,
    parentName: string,
    added: string[]
  ) {
    // delete other children
    return this.knex(field.target)
      .where('parent', parentName)
      .andWhere('name', 'not in', added)
      .delete();
  }

  async rename(schemaName: string, oldName: string, newName: string) {
    await this.knex(schemaName)
      .update({ name: newName })
      .where('name', oldName)
      .then(() => {
        this.clearValueCache(schemaName, oldName);
      });
    await this.commit();
  }

  prepareChild(
    parentSchemaName: string,
    parentName: string,
    child: FieldValueMap,
    field: Field,
    idx: number
  ) {
    if (!child.name) {
      child.name = getRandomString();
    }
    child.parentName = parentName;
    child.parentSchemaName = parentSchemaName;
    child.parentFieldname = field.fieldname;
    child.idx = idx;
  }

  clearValueCache(schemaName: string, name: string) {
    const cacheKey = `${schemaName}:${name}`;
    this.cache.hclear(cacheKey);
  }

  async addForeignKeys(schemaName: string, newForeignKeys: Field[]) {
    await this.sql('PRAGMA foreign_keys=OFF');
    await this.sql('BEGIN TRANSACTION');

    const tempName = 'TEMP' + schemaName;

    // create temp table
    await this.createTable(schemaName, tempName);

    try {
      // copy from old to new table
      await this.knex(tempName).insert(this.knex.select().from(schemaName));
    } catch (err) {
      await this.sql('ROLLBACK');
      await this.sql('PRAGMA foreign_keys=ON');

      const rows = await this.knex.select().from(schemaName);
      await this.prestigeTheTable(schemaName, rows);
      return;
    }

    // drop old table
    await this.knex.schema.dropTable(schemaName);

    // rename new table
    await this.knex.schema.renameTable(tempName, schemaName);

    await this.sql('COMMIT');
    await this.sql('PRAGMA foreign_keys=ON');
  }

  async getAll({
    schemaName,
    fields,
    filters,
    start,
    limit,
    groupBy,
    orderBy = 'creation',
    order = 'desc',
  }: GetAllOptions = {}): Promise<FieldValueMap[]> {
    const schema = this.schemaMap[schemaName];
    if (!fields) {
      fields = ['name', ...(schema.keywordFields ?? [])];
    }

    if (typeof fields === 'string') {
      fields = [fields];
    }

    return (await this.getQueryBuilder(schemaName, fields, filters, {
      offset: start,
      limit,
      groupBy,
      orderBy,
      order,
    })) as FieldValueMap[];
  }

  async get(
    schemaName: string,
    name: string = '',
    fields: string | string[] = '*'
  ) {
    const schema = this.schemaMap[schemaName];
    let fieldValueMap: FieldValueMap;
    if (schema.isSingle) {
      fieldValueMap = await this.getSingle(schemaName);
      fieldValueMap.name = schemaName;
    } else {
      if (!name) {
        throw new ValueError('name is mandatory');
      }
      fieldValueMap = await this.getOne(schemaName, name, fields);
    }
    if (!fieldValueMap) {
      return;
    }
    await this.loadChildren(fieldValueMap, schemaName);
    return fieldValueMap;
  }

  async getOne(
    schemaName: string,
    name: string,
    fields: string | string[] = '*'
  ) {
    const fieldValueMap: FieldValueMap = await this.knex
      .select(fields)
      .from(schemaName)
      .where('name', name)
      .first();
    return fieldValueMap;
  }

  async getSingle(schemaName: string): Promise<FieldValueMap> {
    const values = await this.getAll({
      schemaName: 'SingleValue',
      fields: ['fieldname', 'value'],
      filters: { parent: schemaName },
      orderBy: 'fieldname',
      order: 'asc',
    });

    const fieldValueMap: FieldValueMap = {};
    for (const row of values) {
      fieldValueMap[row.fieldname as string] = row.value as RawValue;
    }

    return fieldValueMap;
  }

  async loadChildren(fieldValueMap: FieldValueMap, schemaName: string) {
    // Sets children on a field
    const tableFields = getFieldsByType(
      schemaName,
      this.schemaMap,
      FieldTypeEnum.Table
    ) as TargetField[];

    for (const field of tableFields) {
      fieldValueMap[field.fieldname] = await this.getAll({
        schemaName: field.target,
        fields: ['*'],
        filters: { parent: fieldValueMap.name as string },
        orderBy: 'idx',
        order: 'asc',
      });
    }
  }

  async insert(schemaName: string, fieldValueMap: FieldValueMap) {
    // insert parent
    if (this.schemaMap[schemaName].isSingle) {
      await this.updateSingleValues(schemaName, fieldValueMap);
    } else {
      await this.insertOne(schemaName, fieldValueMap);
    }

    // insert children
    await this.insertOrUpdateChildren(schemaName, fieldValueMap, false);
    return fieldValueMap;
  }

  insertOne(schemaName: string, fieldValueMap: FieldValueMap) {
    const fields = this.schemaMap[schemaName].fields;
    if (!fieldValueMap.name) {
      fieldValueMap.name = getRandomString();
    }

    const validMap = {};
    for (const { fieldname, fieldtype } of fields) {
      if (fieldtype === FieldTypeEnum.Table) {
        continue;
      }

      validMap[fieldname] = fieldValueMap[fieldname];
    }

    return this.knex(schemaName).insert(fieldValueMap);
  }

  async updateSingleValues(
    singleSchemaName: string,
    fieldValueMap: FieldValueMap
  ) {
    const fields = this.schemaMap[singleSchemaName].fields;
    await this.deleteSingleValues(singleSchemaName);

    for (const field of fields) {
      const value = fieldValueMap[field.fieldname] as RawValue | undefined;
      if (value === undefined) {
        continue;
      }

      await this.updateSingleValue(singleSchemaName, field.fieldname, value);
    }
  }

  async updateSingleValue(
    singleSchemaName: string,
    fieldname: string,
    value: RawValue
  ) {
    return await this.knex('SingleValue')
      .where({
        parent: singleSchemaName,
        fieldname,
      })
      .update({ value });
  }

  async migrate() {
    for (const schemaName in this.schemaMap) {
      const schema = this.schemaMap[schemaName];
      if (schema.isSingle) {
        continue;
      }

      if (await this.tableExists(schemaName)) {
        await this.alterTable(schemaName);
      } else {
        await this.createTable(schemaName);
      }
    }

    await this.commit();
    await this.initializeSingles();
  }

  async initializeSingles() {
    const singleSchemaNames = Object.keys(this.schemaMap).filter(
      (n) => this.schemaMap[n].isSingle
    );

    for (const schemaName of singleSchemaNames) {
      if (await this.singleExists(schemaName)) {
        await this.updateNonExtantSingleValues(schemaName);
        continue;
      }

      const fields = this.schemaMap[schemaName].fields;
      if (fields.every((f) => f.default === undefined)) {
        continue;
      }

      const defaultValues: FieldValueMap = fields.reduce((acc, f) => {
        if (f.default !== undefined) {
          acc[f.fieldname] = f.default;
        }

        return acc;
      }, {});

      await this.updateSingleValues(schemaName, defaultValues);
    }
  }

  async updateNonExtantSingleValues(schemaName: string) {
    const singleValues = await this.getNonExtantSingleValues(schemaName);
    for (const sv of singleValues) {
      await this.updateSingleValue(schemaName, sv.fieldname, sv.value);
    }
  }

  async updateOne(schemaName: string, fieldValueMap: FieldValueMap) {
    const updateMap = { ...fieldValueMap };
    delete updateMap.name;

    return await this.knex(schemaName)
      .where('name', fieldValueMap.name as string)
      .update(updateMap)
      .then(() => {
        const cacheKey = `${schemaName}:${fieldValueMap.name}`;
        if (!this.cache.hexists(cacheKey)) {
          return;
        }

        for (const fieldname in updateMap) {
          const value = updateMap[fieldname];
          this.cache.hset(cacheKey, fieldname, value);
        }
      });
  }

  async update(schemaName: string, fieldValueMap: FieldValueMap) {
    // update parent
    if (this.schemaMap[schemaName].isSingle) {
      await this.updateSingleValues(schemaName, fieldValueMap);
    } else {
      await this.updateOne(schemaName, fieldValueMap);
    }

    // insert or update children
    await this.insertOrUpdateChildren(schemaName, fieldValueMap, true);
  }

  async insertOrUpdateChildren(
    schemaName: string,
    fieldValueMap: FieldValueMap,
    isUpdate: boolean
  ) {
    const tableFields = getFieldsByType(
      schemaName,
      this.schemaMap,
      FieldTypeEnum.Table
    ) as TargetField[];

    const parentName = fieldValueMap.name as string;
    for (const field of tableFields) {
      const added: string[] = [];

      const tableFieldValue = (fieldValueMap[field.fieldname] ??
        []) as FieldValueMap[];
      for (const child of tableFieldValue) {
        this.prepareChild(schemaName, parentName, child, field, added.length);

        if (
          isUpdate &&
          (await this.exists(field.target, child.name as string))
        ) {
          await this.updateOne(field.target, child);
        } else {
          await this.insertOne(field.target, child);
        }

        added.push(child.name as string);
      }

      if (isUpdate) {
        await this.runDeleteOtherChildren(field, parentName, added);
      }
    }
  }

  async exists(schemaName: string, name?: string): Promise<boolean> {
    const schema = this.schemaMap[schemaName];
    if (schema.isSingle) {
      return this.singleExists(schemaName);
    }

    let row = [];
    try {
      const qb = this.knex(schemaName);
      if (name !== undefined) {
        qb.where({ name });
      }
      row = await qb.limit(1);
    } catch (err) {
      if (this.getError(err as Error) !== NotFoundError) {
        throw err;
      }
    }
    return row.length > 0;
  }

  /**
   * Get list of values from the singles table.
   * @param  {...string | Object} fieldnames list of fieldnames to get the values of
   * @returns {Array<Object>} array of {parent, value, fieldname}.
   * @example
   * Database.getSingleValues('internalPrecision');
   * // returns [{ fieldname: 'internalPrecision', parent: 'SystemSettings', value: '12' }]
   * @example
   * Database.getSingleValues({fieldname:'internalPrecision', parent: 'SystemSettings'});
   * // returns [{ fieldname: 'internalPrecision', parent: 'SystemSettings', value: '12' }]
   */
  async getSingleValues(
    ...fieldnames: { fieldname: string; parent?: string }[]
  ) {
    fieldnames = fieldnames.map((fieldname) => {
      if (typeof fieldname === 'string') {
        return { fieldname };
      }
      return fieldname;
    });

    let builder = this.knex('SingleValue');
    builder = builder.where(fieldnames[0]);

    fieldnames.slice(1).forEach(({ fieldname, parent }) => {
      if (typeof parent === 'undefined') {
        builder = builder.orWhere({ fieldname });
      } else {
        builder = builder.orWhere({ fieldname, parent });
      }
    });

    let values: { fieldname: string; parent: string; value: RawValue }[] = [];
    try {
      values = await builder.select('fieldname', 'value', 'parent');
    } catch (err) {
      if (this.getError(err as Error) === NotFoundError) {
        return [];
      }

      throw err;
    }

    return values;
  }

  async getValue(
    schemaName: string,
    filters: string | Record<string, string>,
    fieldname = 'name'
  ): Promise<RawValue | undefined> {
    if (typeof filters === 'string') {
      filters = { name: filters };
    }

    const row = await this.getAll({
      schemaName,
      fields: [fieldname],
      filters: filters,
      start: 0,
      limit: 1,
      orderBy: 'name',
      order: 'asc',
    });

    if (row.length === 1) {
      return row[0][fieldname] as RawValue;
    }

    return undefined;
  }

  async setValue(
    schemaName: string,
    name: string,
    fieldname: string,
    value: RawValue
  ) {
    return await this.setValues(schemaName, name, {
      [fieldname]: value,
    });
  }

  async setValues(
    schemaName: string,
    name: string,
    fieldValueMap: FieldValueMap
  ) {
    return this.updateOne(
      schemaName,
      Object.assign({}, fieldValueMap, { name })
    );
  }

  async getCachedValue(schemaName: string, name: string, fieldname: string) {
    let value = this.cache.hget(`${schemaName}:${name}`, fieldname);
    if (value == null) {
      value = await this.getValue(schemaName, name, fieldname);
    }
    return value;
  }
}
