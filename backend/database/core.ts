import { knex, Knex } from 'knex';
import { pesa } from 'pesa';
import { getRandomString } from '../../frappe/utils';
import CacheManager from '../../frappe/utils/cacheManager';
import {
  CannotCommitError,
  DatabaseError,
  DuplicateEntryError,
  LinkValidationError,
  ValueError,
} from '../../frappe/utils/errors';
import Observable from '../../frappe/utils/observable';
import { getMeta, getModels, getNewDoc, sqliteTypeMap } from '../common';
import { GetQueryBuilderOptions, QueryFilter, RawData } from './types';

interface GetAllOptions {
  doctype?: string;
  fields?: string[];
  filters?: Record<string, string>;
  start?: number;
  limit?: number;
  groupBy?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export default class Database extends Observable<never> {
  knex: Knex;
  cache: CacheManager;
  typeMap = sqliteTypeMap;

  constructor(dbPath: string) {
    super();
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
    //
  }

  /**
   * TODO: Refactor this
   *
   * essentially it's not models that are required by the database
   * but the schema, all the information that is relevant to building
   * tables needs to given to this function.
   */
  async migrate() {
    const models = getModels();
    for (const doctype in models) {
      // check if controller module
      const meta = getMeta(doctype);
      const baseDoctype = meta.getBaseDocType();

      if (!meta.isSingle) {
        if (await this.tableExists(baseDoctype)) {
          await this.alterTable(baseDoctype);
        } else {
          await this.createTable(baseDoctype);
        }
      }
    }

    await this.commit();
    await this.initializeSingles();
  }

  async initializeSingles() {
    const models = getModels();
    const singleDoctypes = Object.keys(models)
      .filter((n) => models[n].isSingle)
      .map((n) => models[n].name);

    for (const doctype of singleDoctypes) {
      if (await this.singleExists(doctype)) {
        const singleValues = await this.getSingleFieldsToInsert(doctype);
        singleValues.forEach(({ fieldname, value }) => {
          const singleValue = getNewDoc({
            doctype: 'SingleValue',
            parent: doctype,
            fieldname,
            value,
          });
          singleValue.insert();
        });
        continue;
      }
      const meta = getMeta(doctype);
      if (meta.fields.every((df) => df.default == null)) {
        continue;
      }
      const defaultValues = meta.fields.reduce((doc, df) => {
        if (df.default != null) {
          doc[df.fieldname] = df.default;
        }
        return doc;
      }, {});
      await this.updateSingle(doctype, defaultValues);
    }
  }

  async getSingleFieldsToInsert(doctype) {
    const existingFields = (
      await this.knex('SingleValue')
        .where({ parent: doctype })
        .select('fieldname')
    ).map(({ fieldname }) => fieldname);

    return getMeta(doctype)
      .fields.map(({ fieldname, default: value }) => ({
        fieldname,
        value,
      }))
      .filter(
        ({ fieldname, value }) =>
          !existingFields.includes(fieldname) && value !== undefined
      );
  }

  async createTable(doctype, tableName = null) {
    const fields = this.getValidFields(doctype);
    return await this.runCreateTableQuery(tableName || doctype, fields);
  }

  runCreateTableQuery(doctype, fields) {
    return this.knex.schema.createTable(doctype, (table) => {
      for (const field of fields) {
        this.buildColumnForTable(table, field);
      }
    });
  }

  async alterTable(doctype) {
    // get columns
    const diff = await this.getColumnDiff(doctype);
    const newForeignKeys = await this.getNewForeignKeys(doctype);

    return this.knex.schema
      .table(doctype, (table) => {
        if (diff.added.length) {
          for (const field of diff.added) {
            this.buildColumnForTable(table, field);
          }
        }

        if (diff.removed.length) {
          this.removeColumns(doctype, diff.removed);
        }
      })
      .then(() => {
        if (newForeignKeys.length) {
          return this.addForeignKeys(doctype, newForeignKeys);
        }
      });
  }

  buildColumnForTable(table, field) {
    const columnType = this.typeMap[field.fieldtype];
    if (!columnType) {
      // In case columnType is "Table"
      // childTable links are handled using the childTable's "parent" field
      return;
    }

    const column = table[columnType](field.fieldname);

    // primary key
    if (field.fieldname === 'name') {
      column.primary();
    }

    // default value
    if (!!field.default && !(field.default instanceof Function)) {
      column.defaultTo(field.default);
    }

    // required
    if (
      (!!field.required && !(field.required instanceof Function)) ||
      field.fieldtype === 'Currency'
    ) {
      column.notNullable();
    }

    // link
    if (field.fieldtype === 'Link' && field.target) {
      const meta = getMeta(field.target);
      table
        .foreign(field.fieldname)
        .references('name')
        .inTable(meta.getBaseDocType())
        .onUpdate('CASCADE')
        .onDelete('RESTRICT');
    }
  }

  async getColumnDiff(doctype) {
    const tableColumns = await this.getTableColumns(doctype);
    const validFields = this.getValidFields(doctype);
    const diff = { added: [], removed: [] };

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

  async getNewForeignKeys(doctype) {
    const foreignKeys = await this.getForeignKeys(doctype);
    const newForeignKeys = [];
    const meta = getMeta(doctype);
    for (const field of meta.getValidFields({ withChildren: false })) {
      if (
        field.fieldtype === 'Link' &&
        !foreignKeys.includes(field.fieldname)
      ) {
        newForeignKeys.push(field);
      }
    }
    return newForeignKeys;
  }

  async get(doctype, name = null, fields = '*') {
    const meta = getMeta(doctype);
    let doc;
    if (meta.isSingle) {
      doc = await this.getSingle(doctype);
      doc.name = doctype;
    } else {
      if (!name) {
        throw new ValueError('name is mandatory');
      }
      doc = await this.getOne(doctype, name, fields);
    }
    if (!doc) {
      return;
    }
    await this.loadChildren(doc, meta);
    return doc;
  }

  async loadChildren(doc, meta) {
    // load children
    const tableFields = meta.getTableFields();
    for (const field of tableFields) {
      doc[field.fieldname] = await this.getAll({
        doctype: field.childtype,
        fields: ['*'],
        filters: { parent: doc.name },
        orderBy: 'idx',
        order: 'asc',
      });
    }
  }

  async getSingle(doctype) {
    const values = await this.getAll({
      doctype: 'SingleValue',
      fields: ['fieldname', 'value'],
      filters: { parent: doctype },
      orderBy: 'fieldname',
      order: 'asc',
    });
    const doc = {};
    for (const row of values) {
      doc[row.fieldname] = row.value;
    }
    return doc;
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
  async getSingleValues(...fieldnames) {
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

    let values = [];
    try {
      values = await builder.select('fieldname', 'value', 'parent');
    } catch (error) {
      if (error.message.includes('no such table')) {
        return [];
      }
      throw error;
    }

    return values.map((value) => {
      const fields = getMeta(value.parent).fields;
      return this.getDocFormattedDoc(fields, values);
    });
  }

  async getOne(doctype, name, fields = '*') {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();

    const doc = await this.knex
      .select(fields)
      .from(baseDoctype)
      .where('name', name)
      .first();

    if (!doc) {
      return doc;
    }

    return this.getDocFormattedDoc(meta.fields, doc);
  }

  getDocFormattedDoc(fields, doc) {
    // format for usage, not going into the db
    const docFields = Object.keys(doc);
    const filteredFields = fields.filter(({ fieldname }) =>
      docFields.includes(fieldname)
    );

    const formattedValues = filteredFields.reduce((d, field) => {
      const { fieldname } = field;
      d[fieldname] = this.getDocFormattedValues(field, doc[fieldname]);
      return d;
    }, {});

    return Object.assign(doc, formattedValues);
  }

  getDocFormattedValues(field, value) {
    // format for usage, not going into the db
    try {
      if (field.fieldtype === 'Currency') {
        return pesa(value);
      }
    } catch (err) {
      err.message += ` value: '${value}' of type: ${typeof value}, fieldname: '${
        field.fieldname
      }', label: '${field.label}'`;
      throw err;
    }
    return value;
  }

  triggerChange(doctype, name) {
    this.trigger(`change:${doctype}`, { name }, 500);
    this.trigger(`change`, { doctype, name }, 500);
    // also trigger change for basedOn doctype
    const meta = getMeta(doctype);
    if (meta.basedOn) {
      this.triggerChange(meta.basedOn, name);
    }
  }

  async insert(doctype, doc) {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    doc = this.applyBaseDocTypeFilters(doctype, doc);

    // insert parent
    if (meta.isSingle) {
      await this.updateSingle(doctype, doc);
    } else {
      await this.insertOne(baseDoctype, doc);
    }

    // insert children
    await this.insertChildren(meta, doc, baseDoctype);

    this.triggerChange(doctype, doc.name);

    return doc;
  }

  async insertChildren(meta, doc, doctype) {
    const tableFields = meta.getTableFields();
    for (const field of tableFields) {
      let idx = 0;
      for (const child of doc[field.fieldname] || []) {
        this.prepareChild(doctype, doc.name, child, field, idx);
        await this.insertOne(field.childtype, child);
        idx++;
      }
    }
  }

  insertOne(doctype, doc) {
    const fields = this.getValidFields(doctype);

    if (!doc.name) {
      doc.name = getRandomString();
    }

    const formattedDoc = this.getFormattedDoc(fields, doc);
    return this.knex(doctype).insert(formattedDoc);
  }

  async update(doctype, doc) {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    doc = this.applyBaseDocTypeFilters(doctype, doc);

    // update parent
    if (meta.isSingle) {
      await this.updateSingle(doctype, doc);
    } else {
      await this.updateOne(baseDoctype, doc);
    }

    // insert or update children
    await this.updateChildren(meta, doc, baseDoctype);

    this.triggerChange(doctype, doc.name);

    return doc;
  }

  async updateChildren(meta, doc, doctype) {
    const tableFields = meta.getTableFields();
    for (const field of tableFields) {
      const added = [];
      for (const child of doc[field.fieldname] || []) {
        this.prepareChild(doctype, doc.name, child, field, added.length);
        if (await this.exists(field.childtype, child.name)) {
          await this.updateOne(field.childtype, child);
        } else {
          await this.insertOne(field.childtype, child);
        }
        added.push(child.name);
      }
      await this.runDeleteOtherChildren(field, doc.name, added);
    }
  }

  updateOne(doctype, doc) {
    const validFields = this.getValidFields(doctype);
    const fieldsToUpdate = Object.keys(doc).filter((f) => f !== 'name');
    const fields = validFields.filter((df) =>
      fieldsToUpdate.includes(df.fieldname)
    );
    const formattedDoc = this.getFormattedDoc(fields, doc);

    return this.knex(doctype)
      .where('name', doc.name)
      .update(formattedDoc)
      .then(() => {
        const cacheKey = `${doctype}:${doc.name}`;
        if (this.cache.hexists(cacheKey)) {
          for (const fieldname in formattedDoc) {
            const value = formattedDoc[fieldname];
            this.cache.hset(cacheKey, fieldname, value);
          }
        }
      });
  }

  runDeleteOtherChildren(field, parent, added) {
    // delete other children
    return this.knex(field.childtype)
      .where('parent', parent)
      .andWhere('name', 'not in', added)
      .delete();
  }

  async updateSingle(doctype, doc) {
    const meta = getMeta(doctype);
    await this.deleteSingleValues(doctype);
    for (const field of meta.getValidFields({ withChildren: false })) {
      const value = doc[field.fieldname];
      if (value != null) {
        const singleValue = getNewDoc({
          doctype: 'SingleValue',
          parent: doctype,
          fieldname: field.fieldname,
          value: value,
        });
        await singleValue.insert();
      }
    }
  }

  async rename(doctype, oldName, newName) {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    await this.knex(baseDoctype)
      .update({ name: newName })
      .where('name', oldName)
      .then(() => {
        this.clearValueCache(doctype, oldName);
      });
    await this.commit();

    this.triggerChange(doctype, newName);
  }

  prepareChild(parenttype, parent, child, field, idx) {
    if (!child.name) {
      child.name = getRandomString();
    }
    child.parent = parent;
    child.parenttype = parenttype;
    child.parentfield = field.fieldname;
    child.idx = idx;
  }

  getValidFields(doctype) {
    return getMeta(doctype).getValidFields({ withChildren: false });
  }

  getFormattedDoc(fields, doc) {
    // format for storage, going into the db
    const formattedDoc = {};
    fields.map((field) => {
      const value = doc[field.fieldname];
      formattedDoc[field.fieldname] = this.getFormattedValue(field, value);
    });
    return formattedDoc;
  }

  getFormattedValue(field, value) {
    // format for storage, going into the db
    const type = typeof value;
    if (field.fieldtype === 'Currency') {
      let currency = value;

      if (type === 'number' || type === 'string') {
        currency = pesa(value);
      }

      const currencyValue = currency.store;
      if (typeof currencyValue !== 'string') {
        throw new Error(
          `invalid currencyValue '${currencyValue}' of type '${typeof currencyValue}' on converting from '${value}' of type '${type}'`
        );
      }

      return currencyValue;
    }

    if (value instanceof Date) {
      if (field.fieldtype === 'Date') {
        // date
        return value.toISOString().substr(0, 10);
      } else {
        // datetime
        return value.toISOString();
      }
    } else if (field.fieldtype === 'Link' && !value) {
      // empty value must be null to satisfy
      // foreign key constraint
      return null;
    } else {
      return value;
    }
  }

  applyBaseDocTypeFilters(doctype, doc) {
    const meta = getMeta(doctype);
    if (meta.filters) {
      for (const fieldname in meta.filters) {
        const value = meta.filters[fieldname];
        if (typeof value !== 'object') {
          doc[fieldname] = value;
        }
      }
    }
    return doc;
  }

  async deleteMany(doctype, names) {
    for (const name of names) {
      await this.delete(doctype, name);
    }
  }

  async delete(doctype, name) {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    await this.deleteOne(baseDoctype, name);

    // delete children
    const tableFields = getMeta(doctype).getTableFields();
    for (const field of tableFields) {
      await this.deleteChildren(field.childtype, name);
    }

    this.triggerChange(doctype, name);
  }

  async deleteOne(doctype, name) {
    return this.knex(doctype)
      .where('name', name)
      .delete()
      .then(() => {
        this.clearValueCache(doctype, name);
      });
  }

  deleteChildren(parenttype, parent) {
    return this.knex(parenttype).where('parent', parent).delete();
  }

  async exists(doctype, name) {
    return (await this.getValue(doctype, name)) ? true : false;
  }

  async getValue(doctype, filters, fieldname = 'name') {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    if (typeof filters === 'string') {
      filters = { name: filters };
    }
    if (meta.filters) {
      Object.assign(filters, meta.filters);
    }

    const row = await this.getAll({
      doctype: baseDoctype,
      fields: [fieldname],
      filters: filters,
      start: 0,
      limit: 1,
      orderBy: 'name',
      order: 'asc',
    });
    return row.length ? row[0][fieldname] : null;
  }

  async setValue(doctype, name, fieldname, value) {
    return await this.setValues(doctype, name, {
      [fieldname]: value,
    });
  }

  async setValues(
    doctype: string,
    name: string,
    fieldValuePair: Record<string, unknown>
  ) {
    const doc = Object.assign({}, fieldValuePair, { name });
    return this.updateOne(doctype, doc);
  }

  async getCachedValue(doctype: string, name: string, fieldname: string) {
    let value = this.cache.hget(`${doctype}:${name}`, fieldname);
    if (value == null) {
      value = await this.getValue(doctype, name, fieldname);
    }
    return value;
  }

  // TODO: Not in core
  async getAll({
    doctype,
    fields,
    filters,
    start,
    limit,
    groupBy,
    orderBy = 'creation',
    order = 'desc',
  }: GetAllOptions = {}) {
    const meta = getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    if (!fields) {
      fields = meta.getKeywordFields();
      fields.push('name');
    }
    if (typeof fields === 'string') {
      fields = [fields];
    }
    if (meta.filters) {
      filters = Object.assign({}, filters, meta.filters);
    }

    const docs = await this.getQueryBuilder(doctype, fields, filters, {
      offset: start,
      limit,
      groupBy,
      orderBy,
      order,
    });
    return docs.map((doc) => this.getDocFormattedDoc(meta.fields, doc));
  }

  clearValueCache(doctype: string, name: string) {
    const cacheKey = `${doctype}:${name}`;
    this.cache.hclear(cacheKey);
  }

  async addForeignKeys(tableName: string, newForeignKeys: string[]) {
    await this.sql('PRAGMA foreign_keys=OFF');
    await this.sql('BEGIN TRANSACTION');

    const tempName = 'TEMP' + tableName;

    // create temp table
    await this.createTable(tableName, tempName);

    try {
      // copy from old to new table
      await this.knex(tempName).insert(this.knex.select().from(tableName));
    } catch (err) {
      await this.sql('ROLLBACK');
      await this.sql('PRAGMA foreign_keys=ON');

      const rows = await this.knex.select().from(tableName);
      await this.prestigeTheTable(tableName, rows);
      return;
    }

    // drop old table
    await this.knex.schema.dropTable(tableName);

    // rename new table
    await this.knex.schema.renameTable(tempName, tableName);

    await this.sql('COMMIT');
    await this.sql('PRAGMA foreign_keys=ON');
  }

  /**
   *
   *
   *
   *
   * Everything below this is a leaf node function in this file
   * and is safe, doesn't reuqire refactors
   *
   *
   *
   *
   *
   */

  async tableExists(tableName: string) {
    return await this.knex.schema.hasTable(tableName);
  }

  async singleExists(singleDoctypeName: string) {
    const res = await this.knex('SingleValue')
      .count('parent as count')
      .where('parent', singleDoctypeName)
      .first();
    return res.count > 0;
  }

  async removeColumns(tableName: string, targetColumns: string[]) {
    // TODO: Implement this for sqlite
  }

  async deleteSingleValues(singleDoctypeName: string) {
    return await this.knex('SingleValue')
      .where('parent', singleDoctypeName)
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

  async prestigeTheTable(tableName: string, tableRows: RawData) {
    const max = 200;

    // Alter table hacx for sqlite in case of schema change.
    const tempName = `__${tableName}`;
    await this.knex.schema.dropTableIfExists(tempName);

    await this.knex.raw('PRAGMA foreign_keys=OFF');
    await this.createTable(tableName, tempName);

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

    await this.knex.schema.dropTable(tableName);
    await this.knex.schema.renameTable(tempName, tableName);
    await this.knex.raw('PRAGMA foreign_keys=ON');
  }

  async getTableColumns(doctype: string) {
    const info = await this.sql(`PRAGMA table_info(${doctype})`);
    return info.map((d) => d.name);
  }

  async getForeignKeys(doctype: string) {
    const foreignKeyList = await this.sql(
      `PRAGMA foreign_key_list(${doctype})`
    );
    return foreignKeyList.map((d) => d.from);
  }

  getQueryBuilder(
    tableName: string,
    fields: string[],
    filters: QueryFilter,
    options: GetQueryBuilderOptions
  ) {
    const builder = this.knex.select(fields).from(tableName);

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
}
