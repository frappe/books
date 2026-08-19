import { getDbError, NotFoundError, ValueError } from 'fyo/utils/errors';
import { knex, Knex } from 'knex';
import {
  Field,
  FieldTypeEnum,
  RawValue,
  Schema,
  SchemaMap,
  TargetField,
} from '../../schemas/types';
import {
  getIsNullOrUndef,
  getRandomString,
  getValueMapFromList,
} from '../../utils';
import { DatabaseBase, GetAllOptions, QueryFilter } from '../../utils/db/types';
import { getDefaultMetaFieldValueMap, sqliteTypeMap, SYSTEM } from '../helpers';
import {
  AlterConfig,
  ColumnDiff,
  FieldValueMap,
  GetQueryBuilderOptions,
  MigrationConfig,
  NonExtantConfig,
  SingleValue,
  UpdateSinglesConfig,
} from './types';

/**
 * # DatabaseCore
 * This is the ORM, the DatabaseCore interface (function signatures) should be
 * replicated by the frontend demuxes and all the backend muxes.
 *
 * ## Db Core Call Sequence
 *
 * 1. Init core: `const db = new DatabaseCore(dbPath)`.
 * 2. Connect db: `db.connect()`. This will allow for raw queries to be executed.
 * 3. Set schemas: `db.setSchemaMap(schemaMap)`. This will allow for ORM functions to be executed.
 * 4. Migrate: `await db.migrate()`. This will create absent tables and update the tables' shape.
 * 5. ORM function execution: `db.get(...)`, `db.insert(...)`, etc.
 * 6. Close connection: `await db.close()`.
 *
 * Note: Meta values: created, modified, createdBy, modifiedBy are set by DatabaseCore
 * only for schemas that are SingleValue. Else they have to be passed by the caller in
 * the `fieldValueMap`.
 */

export default class DatabaseCore extends DatabaseBase {
  knex?: Knex;
  typeMap = sqliteTypeMap;
  dbPath: string;
  schemaMap: SchemaMap = {};
  connectionParams: Knex.Config;

  constructor(dbPath?: string) {
    super();
    this.dbPath = dbPath ?? ':memory:';
    this.connectionParams = {
      client: 'better-sqlite3',
      connection: {
        filename: this.dbPath,
      },
      useNullAsDefault: true,
      asyncStackTraces: process.env.NODE_ENV === 'development',
    };
  }

  static async getCountryCode(dbPath: string): Promise<string> {
    let countryCode = 'in';
    const db = new DatabaseCore(dbPath);
    await db.connect();

    let query: { value: string }[] = [];
    try {
      query = (await db.knex!('SingleValue').where({
        fieldname: 'countryCode',
        parent: 'SystemSettings',
      })) as { value: string }[];
    } catch {
      // Database not inialized and no countryCode passed
    }

    if (query.length > 0) {
      countryCode = query[0].value;
    }

    await db.close();
    return countryCode;
  }

  setSchemaMap(schemaMap: SchemaMap) {
    this.schemaMap = schemaMap;
  }

  async connect() {
    this.knex = knex(this.connectionParams);
    await this.knex.raw('PRAGMA foreign_keys=ON');
  }

  async close() {
    await this.knex!.destroy();
  }

  async migrate(config: MigrationConfig = {}) {
    const { create, alter } = await this.#getCreateAlterList();
    const hasSingleValueTable = !create.includes('SingleValue');
    let singlesConfig: UpdateSinglesConfig = {
      update: [],
      updateNonExtant: [],
    };

    if (hasSingleValueTable) {
      singlesConfig = await this.#getSinglesUpdateList();
    }

    const shouldMigrate = !!(
      create.length ||
      alter.length ||
      singlesConfig.update.length ||
      singlesConfig.updateNonExtant.length
    );

    if (!shouldMigrate) {
      return;
    }

    await config.pre?.();
    for (const schemaName of create) {
      await this.#createTable(schemaName);
    }

    for (const config of alter) {
      await this.#alterTable(config);
    }

    if (!hasSingleValueTable) {
      singlesConfig = await this.#getSinglesUpdateList();
    }

    await this.#initializeSingles(singlesConfig);
    await config.post?.();
  }

  async #getCreateAlterList() {
    const create: string[] = [];
    const alter: AlterConfig[] = [];

    for (const [schemaName, schema] of Object.entries(this.schemaMap)) {
      if (!schema || schema.isSingle) {
        continue;
      }

      const exists = await this.#tableExists(schemaName);
      if (!exists) {
        create.push(schemaName);
        continue;
      }

      const diff: ColumnDiff = await this.#getColumnDiff(schemaName);
      const newForeignKeys: Field[] = await this.#getNewForeignKeys(schemaName);
      if (diff.added.length || diff.removed.length || newForeignKeys.length) {
        alter.push({
          schemaName,
          diff,
          newForeignKeys,
        });
      }
    }

    return { create, alter };
  }

  async exists(schemaName: string, name?: string): Promise<boolean> {
    const schema = this.schemaMap[schemaName] as Schema;
    if (schema.isSingle) {
      return this.#singleExists(schemaName);
    }

    let row = [];
    try {
      const qb = this.knex!(schemaName);
      if (name !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        qb.where({ name });
      }
      row = await qb.limit(1);
    } catch (err) {
      if (getDbError(err as Error) !== NotFoundError) {
        throw err;
      }
    }
    return row.length > 0;
  }

  async insert(
    schemaName: string,
    fieldValueMap: FieldValueMap
  ): Promise<FieldValueMap> {
    // insert parent
    if (this.schemaMap[schemaName]!.isSingle) {
      await this.#updateSingleValues(schemaName, fieldValueMap);
    } else {
      await this.#insertOne(schemaName, fieldValueMap);
    }

    // insert children
    await this.#insertOrUpdateChildren(schemaName, fieldValueMap, false);
    return fieldValueMap;
  }

  async get(
    schemaName: string,
    name = '',
    fields?: string | string[]
  ): Promise<FieldValueMap> {
    const schema = this.schemaMap[schemaName] as Schema;
    if (!schema.isSingle && !name) {
      throw new ValueError('name is mandatory');
    }

    /**
     * If schema is single return all the values
     * of the single type schema, in this case field
     * is ignored.
     */
    let fieldValueMap: FieldValueMap = {};
    if (schema.isSingle) {
      return await this.#getSingle(schemaName);
    }

    if (typeof fields === 'string') {
      fields = [fields];
    }

    if (fields === undefined) {
      fields = schema.fields.filter((f) => !f.computed).map((f) => f.fieldname);
    }

    /**
     * Separate table fields and non table fields
     */
    const allTableFields: TargetField[] = this.#getTableFields(schemaName);
    const allTableFieldNames: string[] = allTableFields.map((f) => f.fieldname);
    const tableFields: TargetField[] = allTableFields.filter((f) =>
      fields!.includes(f.fieldname)
    );
    const nonTableFieldNames: string[] = fields.filter(
      (f) => !allTableFieldNames.includes(f)
    );

    /**
     * If schema is not single then return specific fields
     * if child fields are selected, all child fields are returned.
     */
    if (nonTableFieldNames.length) {
      fieldValueMap =
        (await this.#getOne(schemaName, name, nonTableFieldNames)) ?? {};
    }

    if (tableFields.length) {
      await this.#loadChildren(name, fieldValueMap, tableFields);
    }
    return fieldValueMap;
  }

  async getAll(
    schemaName: string,
    options: GetAllOptions = {}
  ): Promise<FieldValueMap[]> {
    const schema = this.schemaMap[schemaName] as Schema;
    if (schema === undefined) {
      throw new NotFoundError(`schema ${schemaName} not found`);
    }

    const hasCreated = !!schema.fields.find((f) => f.fieldname === 'created');

    const {
      fields = ['name'],
      filters,
      offset,
      limit,
      groupBy,
      orderBy = hasCreated ? 'created' : undefined,
      order = 'desc',
    } = options;

    return (await this.#getQueryBuilder(
      schemaName,
      typeof fields === 'string' ? [fields] : fields,
      filters ?? {},
      {
        offset,
        limit,
        groupBy,
        orderBy,
        order,
      }
    )) as FieldValueMap[];
  }

  async deleteAll(schemaName: string, filters: QueryFilter): Promise<number> {
    const builder = this.knex!(schemaName);
    this.#applyFiltersToBuilder(builder, filters);
    return await builder.delete();
  }

  async getSingleValues(
    ...fieldnames: ({ fieldname: string; parent?: string } | string)[]
  ): Promise<SingleValue<RawValue>> {
    const fieldnameList = fieldnames.map((fieldname) => {
      if (typeof fieldname === 'string') {
        return { fieldname };
      }
      return fieldname;
    });

    let builder = this.knex!('SingleValue');
    builder = builder.where(fieldnameList[0]);

    fieldnameList.slice(1).forEach(({ fieldname, parent }) => {
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
      if (getDbError(err as Error) === NotFoundError) {
        return [];
      }

      throw err;
    }

    return values;
  }

  async rename(schemaName: string, oldName: string, newName: string) {
    /**
     * Rename is expensive mostly won't allow it.
     * TODO: rename all links
     * TODO: rename in childtables
     */
    await this.knex!(schemaName)
      .update({ name: newName })
      .where('name', oldName);
  }

  async update(schemaName: string, fieldValueMap: FieldValueMap) {
    // update parent
    if (this.schemaMap[schemaName]!.isSingle) {
      await this.#updateSingleValues(schemaName, fieldValueMap);
    } else {
      await this.#updateOne(schemaName, fieldValueMap);
    }

    // insert or update children
    await this.#insertOrUpdateChildren(schemaName, fieldValueMap, true);
  }

  async delete(schemaName: string, name: string) {
    const schema = this.schemaMap[schemaName] as Schema;
    if (schema.isSingle) {
      await this.#deleteSingle(schemaName, name);
      return;
    }

    await this.#deleteOne(schemaName, name);

    // delete children
    const tableFields = this.#getTableFields(schemaName);

    for (const field of tableFields) {
      await this.#deleteChildren(field.target, name);
    }
  }

  async #tableExists(schemaName: string): Promise<boolean> {
    return await this.knex!.schema.hasTable(schemaName);
  }

  async #singleExists(singleSchemaName: string): Promise<boolean> {
    const res = await this.knex!('SingleValue')
      .count('parent as count')
      .where('parent', singleSchemaName)
      .first();
    if (typeof res?.count === 'number') {
      return res.count > 0;
    }

    return false;
  }

  async #dropColumns(schemaName: string, targetColumns: string[]) {
    await this.knex!.schema.table(schemaName, (table) => {
      table.dropColumns(...targetColumns);
    });
  }

  async prestigeTheTable(schemaName: string, tableRows: FieldValueMap[]) {
    // Alter table hacx for sqlite in case of schema change.
    const tempName = `__${schemaName}`;

    // Create replacement table
    await this.knex!.schema.dropTableIfExists(tempName);
    await this.knex!.raw('PRAGMA foreign_keys=OFF');
    await this.#createTable(schemaName, tempName);

    // Insert rows from source table into the replacement table
    await this.knex!.batchInsert(tempName, tableRows, 200);

    // Replace with the replacement table
    await this.knex!.schema.dropTable(schemaName);
    await this.knex!.schema.renameTable(tempName, schemaName);
    await this.knex!.raw('PRAGMA foreign_keys=ON');
  }

  async #getTableColumns(schemaName: string): Promise<string[]> {
    const info: FieldValueMap[] = await this.knex!.raw(
      `PRAGMA table_info(${schemaName})`
    );
    return info.map((d) => d.name as string);
  }

  async truncate(tableNames?: string[]) {
    if (tableNames === undefined) {
      const q = (await this.knex!.raw(`
        select name from sqlite_schema
        where type='table'
        and name not like 'sqlite_%'`)) as { name: string }[];
      tableNames = q.map((i) => i.name);
    }

    for (const name of tableNames) {
      await this.knex!(name).del();
    }
  }

  async #getForeignKeys(schemaName: string): Promise<string[]> {
    const foreignKeyList: FieldValueMap[] = await this.knex!.raw(
      `PRAGMA foreign_key_list(${schemaName})`
    );
    return foreignKeyList.map((d) => d.from as string);
  }

  #getQueryBuilder(
    schemaName: string,
    fields: string[],
    filters: QueryFilter,
    options: GetQueryBuilderOptions
  ): Knex.QueryBuilder {
    /* eslint-disable @typescript-eslint/no-floating-promises */
    const builder = this.knex!.select(fields).from(schemaName);

    this.#applyFiltersToBuilder(builder, filters);

    const { orderBy, groupBy, order } = options;
    if (Array.isArray(orderBy)) {
      builder.orderBy(orderBy.map((column) => ({ column, order })));
    }

    if (typeof orderBy === 'string') {
      builder.orderBy(orderBy, order);
    }

    if (Array.isArray(groupBy)) {
      builder.groupBy(...groupBy);
    }

    if (typeof groupBy === 'string') {
      builder.groupBy(groupBy);
    }

    if (options.offset) {
      builder.offset(options.offset);
    }

    if (options.limit) {
      builder.limit(options.limit);
    }

    return builder;
  }

  #applyFiltersToBuilder(builder: Knex.QueryBuilder, filters: QueryFilter) {
    // {"status": "Open"} => `status = "Open"`

    // {"status": "Open", "name": ["like", "apple%"]}
    // => `status="Open" and name like "apple%"

    // {"date": [">=", "2017-09-09", "<=", "2017-11-01"]}
    // => `date >= 2017-09-09 and date <= 2017-11-01`

    const filtersArray = this.#getFiltersArray(filters);
    for (let i = 0; i < filtersArray.length; i++) {
      const filter = filtersArray[i];
      const field = filter[0] as string;
      const operator = filter[1];
      const comparisonValue = filter[2];
      const type = i === 0 ? 'where' : 'andWhere';

      if (operator === '=') {
        builder[type](field, comparisonValue);
      } else if (
        operator === 'in' &&
        (comparisonValue as (string | null)[]).includes(null)
      ) {
        const nonNulls = (comparisonValue as (string | null)[]).filter(
          Boolean
        ) as string[];
        builder[type](field, operator, nonNulls).orWhere(field, null);
      } else {
        builder[type](field, operator as string, comparisonValue as string);
      }
    }
  }

  #getFiltersArray(filters: QueryFilter) {
    const filtersArray = [];
    for (const field in filters) {
      const value = filters[field];

      let operator: string | number = '=';
      let comparisonValue = value as string | number | (string | number)[];

      if (Array.isArray(value)) {
        operator = (value[0] as string).toLowerCase();
        comparisonValue = value[1] as string | number | (string | number)[];

        if (operator === 'includes') {
          operator = 'like';
        }

        if (
          operator === 'like' &&
          typeof comparisonValue === 'string' &&
          !comparisonValue.includes('%')
        ) {
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

    return filtersArray;
  }

  async #getColumnDiff(schemaName: string): Promise<ColumnDiff> {
    const tableColumns = await this.#getTableColumns(schemaName);
    const validFields = this.schemaMap[schemaName]!.fields.filter(
      (f) => !f.computed
    );
    const diff: ColumnDiff = { added: [], removed: [] };

    for (const field of validFields) {
      const hasDbType = this.typeMap.hasOwnProperty(field.fieldtype);
      if (!tableColumns.includes(field.fieldname) && hasDbType) {
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

  async #getNewForeignKeys(schemaName: string): Promise<Field[]> {
    const foreignKeys = await this.#getForeignKeys(schemaName);
    const newForeignKeys: Field[] = [];
    const schema = this.schemaMap[schemaName] as Schema;
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

  #buildColumnForTable(table: Knex.AlterTableBuilder, field: Field) {
    if (field.fieldtype === FieldTypeEnum.Table) {
      // In case columnType is "Table"
      // childTable links are handled using the childTable's "parent" field
      return;
    }

    const columnType = this.typeMap[field.fieldtype];
    if (!columnType) {
      return;
    }

    const column = table[columnType](
      field.fieldname
    ) as Knex.SqlLiteColumnBuilder;

    // primary key
    if (field.fieldname === 'name') {
      column.primary();
    }

    // iefault value
    if (field.default !== undefined) {
      column.defaultTo(field.default);
    }

    // required
    if (field.required) {
      column.notNullable();
    }

    // link
    if (field.fieldtype === FieldTypeEnum.Link && field.target) {
      const targetSchemaName = field.target;
      const schema = this.schemaMap[targetSchemaName] as Schema;
      table
        .foreign(field.fieldname)
        .references('name')
        .inTable(schema.name)
        .onUpdate('CASCADE')
        .onDelete('RESTRICT');
    }
  }

  async #alterTable({ schemaName, diff, newForeignKeys }: AlterConfig) {
    await this.knex!.schema.table(schemaName, (table) => {
      if (!diff.added.length) {
        return;
      }

      for (const field of diff.added) {
        this.#buildColumnForTable(table, field);
      }
    });

    if (diff.removed.length) {
      await this.#dropColumns(schemaName, diff.removed);
    }

    if (newForeignKeys.length) {
      await this.#addForeignKeys(schemaName);
    }
  }

  async #createTable(schemaName: string, tableName?: string) {
    tableName ??= schemaName;
    const fields = this.schemaMap[schemaName]!.fields.filter(
      (f) => !f.computed
    );
    return await this.#runCreateTableQuery(tableName, fields);
  }

  #runCreateTableQuery(schemaName: string, fields: Field[]) {
    return this.knex!.schema.createTable(schemaName, (table) => {
      for (const field of fields) {
        this.#buildColumnForTable(table, field);
      }
    });
  }

  async #getNonExtantSingleValues(singleSchemaName: string) {
    const existingFields = (
      (await this.knex!('SingleValue')
        .where({ parent: singleSchemaName })
        .select('fieldname')) as { fieldname: string }[]
    ).map(({ fieldname }) => fieldname);

    const nonExtant: NonExtantConfig['nonExtant'] = [];
    const fields = this.schemaMap[singleSchemaName]?.fields ?? [];
    for (const { fieldname, default: value } of fields) {
      if (existingFields.includes(fieldname) || value === undefined) {
        continue;
      }

      nonExtant.push({ fieldname, value });
    }

    return nonExtant;
  }

  async #deleteOne(schemaName: string, name: string) {
    return await this.knex!(schemaName).where('name', name).delete();
  }

  async #deleteSingle(schemaName: string, fieldname: string) {
    return await this.knex!('SingleValue')
      .where({ parent: schemaName, fieldname })
      .delete();
  }

  #deleteChildren(schemaName: string, parentName: string) {
    return this.knex!(schemaName).where('parent', parentName).delete();
  }

  #runDeleteOtherChildren(
    field: TargetField,
    parentName: string,
    added: string[]
  ) {
    // delete other children
    return this.knex!(field.target)
      .where('parent', parentName)
      .andWhere('name', 'not in', added)
      .delete();
  }

  #prepareChild(
    parentSchemaName: string,
    parentName: string,
    child: FieldValueMap,
    field: Field,
    idx: number
  ) {
    if (!child.name) {
      child.name ??= getRandomString();
    }
    child.parent = parentName;
    child.parentSchemaName = parentSchemaName;
    child.parentFieldname = field.fieldname;
    child.idx ??= idx;
  }

  async #addForeignKeys(schemaName: string) {
    const tableRows = await this.knex!.select().from(schemaName);
    await this.prestigeTheTable(schemaName, tableRows);
  }

  async #loadChildren(
    parentName: string,
    fieldValueMap: FieldValueMap,
    tableFields: TargetField[]
  ) {
    for (const field of tableFields) {
      fieldValueMap[field.fieldname] = await this.getAll(field.target, {
        fields: ['*'],
        filters: { parent: parentName },
        orderBy: 'idx',
        order: 'asc',
      });
    }
  }

  async #getOne(schemaName: string, name: string, fields: string[]) {
    const fieldValueMap = (await this.knex!.select(fields)
      .from(schemaName)
      .where('name', name)
      .first()) as FieldValueMap;
    return fieldValueMap;
  }

  async #getSingle(schemaName: string): Promise<FieldValueMap> {
    const values = await this.getAll('SingleValue', {
      fields: ['fieldname', 'value'],
      filters: { parent: schemaName },
      orderBy: 'fieldname',
      order: 'asc',
    });

    const fieldValueMap = getValueMapFromList(
      values,
      'fieldname',
      'value'
    ) as FieldValueMap;
    const tableFields: TargetField[] = this.#getTableFields(schemaName);
    if (tableFields.length) {
      await this.#loadChildren(schemaName, fieldValueMap, tableFields);
    }

    return fieldValueMap;
  }

  #insertOne(schemaName: string, fieldValueMap: FieldValueMap) {
    if (!fieldValueMap.name) {
      fieldValueMap.name = getRandomString();
    }

    // Column fields
    const fields = this.schemaMap[schemaName]!.fields.filter(
      (f) => f.fieldtype !== FieldTypeEnum.Table && !f.computed
    );

    const validMap: FieldValueMap = {};
    for (const { fieldname } of fields) {
      validMap[fieldname] = fieldValueMap[fieldname];
    }

    return this.knex!(schemaName).insert(validMap);
  }

  async #updateSingleValues(
    singleSchemaName: string,
    fieldValueMap: FieldValueMap
  ) {
    const fields = this.schemaMap[singleSchemaName]!.fields.filter(
      (f) => !f.computed && f.fieldtype !== 'Table'
    );
    for (const field of fields) {
      const value = fieldValueMap[field.fieldname] as RawValue | undefined;
      if (value === undefined) {
        continue;
      }

      await this.#updateSingleValue(singleSchemaName, field.fieldname, value);
    }
  }

  async #updateSingleValue(
    singleSchemaName: string,
    fieldname: string,
    value: RawValue
  ) {
    const updateKey = {
      parent: singleSchemaName,
      fieldname,
    };

    const names = (await this.knex!('SingleValue')
      .select('name')
      .where(updateKey)) as { name: string }[];

    if (!names?.length) {
      this.#insertSingleValue(singleSchemaName, fieldname, value);
    } else {
      return await this.knex!('SingleValue').where(updateKey).update({
        value,
        modifiedBy: SYSTEM,
        modified: new Date().toISOString(),
      });
    }
  }

  async #insertSingleValue(
    singleSchemaName: string,
    fieldname: string,
    value: RawValue
  ) {
    const updateMap = getDefaultMetaFieldValueMap();
    const fieldValueMap: FieldValueMap = Object.assign({}, updateMap, {
      parent: singleSchemaName,
      fieldname,
      value,
      name: getRandomString(),
    });
    return await this.knex!('SingleValue').insert(fieldValueMap);
  }

  async #getSinglesUpdateList() {
    const update: string[] = [];
    const updateNonExtant: NonExtantConfig[] = [];
    for (const [schemaName, schema] of Object.entries(this.schemaMap)) {
      if (!schema || !schema.isSingle) {
        continue;
      }

      const exists = await this.#singleExists(schemaName);
      if (!exists && schema.fields.some((f) => f.default !== undefined)) {
        update.push(schemaName);
      }

      if (!exists) {
        continue;
      }

      const nonExtant = await this.#getNonExtantSingleValues(schemaName);
      if (nonExtant.length) {
        updateNonExtant.push({
          schemaName,
          nonExtant,
        });
      }
    }

    return { update, updateNonExtant };
  }

  async #initializeSingles({ update, updateNonExtant }: UpdateSinglesConfig) {
    for (const config of updateNonExtant) {
      await this.#updateNonExtantSingleValues(config);
    }

    for (const schemaName of update) {
      const fields = this.schemaMap[schemaName]!.fields;
      const defaultValues: FieldValueMap = fields.reduce((acc, f) => {
        if (f.default !== undefined) {
          acc[f.fieldname] = f.default;
        }

        return acc;
      }, {} as FieldValueMap);

      await this.#updateSingleValues(schemaName, defaultValues);
    }
  }

  async #updateNonExtantSingleValues({
    schemaName,
    nonExtant,
  }: NonExtantConfig) {
    for (const { fieldname, value } of nonExtant) {
      await this.#updateSingleValue(schemaName, fieldname, value);
    }
  }

  async #updateOne(schemaName: string, fieldValueMap: FieldValueMap) {
    const updateMap = { ...fieldValueMap };
    delete updateMap.name;
    const schema = this.schemaMap[schemaName] as Schema;
    for (const { fieldname, fieldtype, computed } of schema.fields) {
      if (fieldtype !== FieldTypeEnum.Table && !computed) {
        continue;
      }

      delete updateMap[fieldname];
    }

    if (Object.keys(updateMap).length === 0) {
      return;
    }

    return await this.knex!(schemaName)
      .where('name', fieldValueMap.name as string)
      .update(updateMap);
  }

  async #insertOrUpdateChildren(
    schemaName: string,
    fieldValueMap: FieldValueMap,
    isUpdate: boolean
  ) {
    let parentName = fieldValueMap.name as string;
    if (this.schemaMap[schemaName]?.isSingle) {
      parentName = schemaName;
    }

    const tableFields = this.#getTableFields(schemaName);

    for (const field of tableFields) {
      const added: string[] = [];

      const tableFieldValue = fieldValueMap[field.fieldname] as
        | FieldValueMap[]
        | undefined
        | null;
      if (getIsNullOrUndef(tableFieldValue)) {
        continue;
      }

      for (const child of tableFieldValue) {
        this.#prepareChild(schemaName, parentName, child, field, added.length);

        if (
          isUpdate &&
          (await this.exists(field.target, child.name as string))
        ) {
          await this.#updateOne(field.target, child);
        } else {
          await this.#insertOne(field.target, child);
        }

        added.push(child.name as string);
      }

      if (isUpdate) {
        await this.#runDeleteOtherChildren(field, parentName, added);
      }
    }
  }

  #getTableFields(schemaName: string): TargetField[] {
    return this.schemaMap[schemaName]!.fields.filter(
      (f) => f.fieldtype === FieldTypeEnum.Table
    ) as TargetField[];
  }
}
