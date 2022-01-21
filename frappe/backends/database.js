const frappe = require('frappe');
const Observable = require('frappe/utils/observable');
const CacheManager = require('frappe/utils/cacheManager');
const Knex = require('knex');

module.exports = class Database extends Observable {
  constructor() {
    super();
    this.initTypeMap();
    this.connectionParams = {};
    this.cache = new CacheManager();
  }

  connect() {
    this.knex = Knex(this.connectionParams);
    this.knex.on('query-error', (error) => {
      error.type = this.getError(error);
    });
    this.executePostDbConnect();
  }

  close() {
    //
  }

  async migrate() {
    for (let doctype in frappe.models) {
      // check if controller module
      let meta = frappe.getMeta(doctype);
      let baseDoctype = meta.getBaseDocType();
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
    let singleDoctypes = frappe
      .getModels((model) => model.isSingle)
      .map((model) => model.name);

    for (let doctype of singleDoctypes) {
      if (await this.singleExists(doctype)) {
        const singleValues = await this.getSingleFieldsToInsert(doctype);
        singleValues.forEach(({ fieldname, value }) => {
          let singleValue = frappe.newDoc({
            doctype: 'SingleValue',
            parent: doctype,
            fieldname,
            value,
          });
          singleValue.insert();
        });
        continue;
      }
      let meta = frappe.getMeta(doctype);
      if (meta.fields.every((df) => df.default == null)) {
        continue;
      }
      let defaultValues = meta.fields.reduce((doc, df) => {
        if (df.default != null) {
          doc[df.fieldname] = df.default;
        }
        return doc;
      }, {});
      await this.updateSingle(doctype, defaultValues);
    }
  }

  async singleExists(doctype) {
    let res = await this.knex('SingleValue')
      .count('parent as count')
      .where('parent', doctype)
      .first();
    return res.count > 0;
  }

  async getSingleFieldsToInsert(doctype) {
    const existingFields = (
      await frappe.db
        .knex('SingleValue')
        .where({ parent: doctype })
        .select('fieldname')
    ).map(({ fieldname }) => fieldname);

    return frappe
      .getMeta(doctype)
      .fields.map(({ fieldname, default: value }) => ({
        fieldname,
        value,
      }))
      .filter(
        ({ fieldname, value }) =>
          !existingFields.includes(fieldname) && value !== undefined
      );
  }

  tableExists(table) {
    return this.knex.schema.hasTable(table);
  }

  async createTable(doctype, tableName = null) {
    let fields = this.getValidFields(doctype);
    return await this.runCreateTableQuery(tableName || doctype, fields);
  }

  runCreateTableQuery(doctype, fields) {
    return this.knex.schema.createTable(doctype, (table) => {
      for (let field of fields) {
        this.buildColumnForTable(table, field);
      }
    });
  }

  async alterTable(doctype) {
    // get columns
    let diff = await this.getColumnDiff(doctype);
    let newForeignKeys = await this.getNewForeignKeys(doctype);

    return this.knex.schema
      .table(doctype, (table) => {
        if (diff.added.length) {
          for (let field of diff.added) {
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
    let columnType = this.getColumnType(field);
    if (!columnType) {
      // In case columnType is "Table"
      // childTable links are handled using the childTable's "parent" field
      return;
    }

    let column = table[columnType](field.fieldname);

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
      let meta = frappe.getMeta(field.target);
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

    for (let field of validFields) {
      if (
        !tableColumns.includes(field.fieldname) &&
        this.getColumnType(field)
      ) {
        diff.added.push(field);
      }
    }

    const validFieldNames = validFields.map((field) => field.fieldname);
    for (let column of tableColumns) {
      if (!validFieldNames.includes(column)) {
        diff.removed.push(column);
      }
    }

    return diff;
  }

  async removeColumns(doctype, removed) {
    for (let column of removed) {
      await this.runRemoveColumnQuery(doctype, column);
    }
  }

  async getNewForeignKeys(doctype) {
    let foreignKeys = await this.getForeignKeys(doctype);
    let newForeignKeys = [];
    let meta = frappe.getMeta(doctype);
    for (let field of meta.getValidFields({ withChildren: false })) {
      if (
        field.fieldtype === 'Link' &&
        !foreignKeys.includes(field.fieldname)
      ) {
        newForeignKeys.push(field);
      }
    }
    return newForeignKeys;
  }

  async addForeignKeys(doctype, newForeignKeys) {
    for (let field of newForeignKeys) {
      this.addForeignKey(doctype, field);
    }
  }

  async getForeignKeys(doctype, field) {
    return [];
  }

  async getTableColumns(doctype) {
    return [];
  }

  async get(doctype, name = null, fields = '*') {
    let meta = frappe.getMeta(doctype);
    let doc;
    if (meta.isSingle) {
      doc = await this.getSingle(doctype);
      doc.name = doctype;
    } else {
      if (!name) {
        throw new frappe.errors.ValueError('name is mandatory');
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
    let tableFields = meta.getTableFields();
    for (let field of tableFields) {
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
    let values = await this.getAll({
      doctype: 'SingleValue',
      fields: ['fieldname', 'value'],
      filters: { parent: doctype },
      orderBy: 'fieldname',
      order: 'asc',
    });
    let doc = {};
    for (let row of values) {
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

    let builder = frappe.db.knex('SingleValue');
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
      const fields = frappe.getMeta(value.parent).fields;
      return this.getDocFormattedDoc(fields, values);
    });
  }

  async getOne(doctype, name, fields = '*') {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();

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
        return frappe.pesa(value);
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
    let meta = frappe.getMeta(doctype);
    if (meta.basedOn) {
      this.triggerChange(meta.basedOn, name);
    }
  }

  async insert(doctype, doc) {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
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
    let tableFields = meta.getTableFields();
    for (let field of tableFields) {
      let idx = 0;
      for (let child of doc[field.fieldname] || []) {
        this.prepareChild(doctype, doc.name, child, field, idx);
        await this.insertOne(field.childtype, child);
        idx++;
      }
    }
  }

  insertOne(doctype, doc) {
    let fields = this.getValidFields(doctype);

    if (!doc.name) {
      doc.name = frappe.getRandomString();
    }

    let formattedDoc = this.getFormattedDoc(fields, doc);
    return this.knex(doctype).insert(formattedDoc);
  }

  async update(doctype, doc) {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
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
    let tableFields = meta.getTableFields();
    for (let field of tableFields) {
      let added = [];
      for (let child of doc[field.fieldname] || []) {
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
    let validFields = this.getValidFields(doctype);
    let fieldsToUpdate = Object.keys(doc).filter((f) => f !== 'name');
    let fields = validFields.filter((df) =>
      fieldsToUpdate.includes(df.fieldname)
    );
    let formattedDoc = this.getFormattedDoc(fields, doc);

    return this.knex(doctype)
      .where('name', doc.name)
      .update(formattedDoc)
      .then(() => {
        let cacheKey = `${doctype}:${doc.name}`;
        if (this.cache.hexists(cacheKey)) {
          for (let fieldname in formattedDoc) {
            let value = formattedDoc[fieldname];
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
    let meta = frappe.getMeta(doctype);
    await this.deleteSingleValues(doctype);
    for (let field of meta.getValidFields({ withChildren: false })) {
      let value = doc[field.fieldname];
      if (value != null) {
        let singleValue = frappe.newDoc({
          doctype: 'SingleValue',
          parent: doctype,
          fieldname: field.fieldname,
          value: value,
        });
        await singleValue.insert();
      }
    }
  }

  deleteSingleValues(name) {
    return this.knex('SingleValue').where('parent', name).delete();
  }

  async rename(doctype, oldName, newName) {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
    await this.knex(baseDoctype)
      .update({ name: newName })
      .where('name', oldName)
      .then(() => {
        this.clearValueCache(doctype, oldName);
      });
    await frappe.db.commit();

    this.triggerChange(doctype, newName);
  }

  prepareChild(parenttype, parent, child, field, idx) {
    if (!child.name) {
      child.name = frappe.getRandomString();
    }
    child.parent = parent;
    child.parenttype = parenttype;
    child.parentfield = field.fieldname;
    child.idx = idx;
  }

  getValidFields(doctype) {
    return frappe.getMeta(doctype).getValidFields({ withChildren: false });
  }

  getFormattedDoc(fields, doc) {
    // format for storage, going into the db
    let formattedDoc = {};
    fields.map((field) => {
      let value = doc[field.fieldname];
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
        currency = frappe.pesa(value);
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
    let meta = frappe.getMeta(doctype);
    if (meta.filters) {
      for (let fieldname in meta.filters) {
        let value = meta.filters[fieldname];
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
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
    await this.deleteOne(baseDoctype, name);

    // delete children
    let tableFields = frappe.getMeta(doctype).getTableFields();
    for (let field of tableFields) {
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
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
    if (typeof filters === 'string') {
      filters = { name: filters };
    }
    if (meta.filters) {
      Object.assign(filters, meta.filters);
    }

    let row = await this.getAll({
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

  async setValues(doctype, name, fieldValuePair) {
    let doc = Object.assign({}, fieldValuePair, { name });
    return this.updateOne(doctype, doc);
  }

  async getCachedValue(doctype, name, fieldname) {
    let value = this.cache.hget(`${doctype}:${name}`, fieldname);
    if (value == null) {
      value = await this.getValue(doctype, name, fieldname);
    }
    return value;
  }

  async getAll({
    doctype,
    fields,
    filters,
    start,
    limit,
    groupBy,
    orderBy = 'creation',
    order = 'desc',
  } = {}) {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
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

    let builder = this.knex.select(fields).from(baseDoctype);

    this.applyFiltersToBuilder(builder, filters);

    if (orderBy) {
      builder.orderBy(orderBy, order);
    }

    if (groupBy) {
      builder.groupBy(groupBy);
    }

    if (start) {
      builder.offset(start);
    }

    if (limit) {
      builder.limit(limit);
    }

    const docs = await builder;
    return docs.map((doc) => this.getDocFormattedDoc(meta.fields, doc));
  }

  applyFiltersToBuilder(builder, filters) {
    // {"status": "Open"} => `status = "Open"`

    // {"status": "Open", "name": ["like", "apple%"]}
    // => `status="Open" and name like "apple%"

    // {"date": [">=", "2017-09-09", "<=", "2017-11-01"]}
    // => `date >= 2017-09-09 and date <= 2017-11-01`

    let filtersArray = [];

    for (let field in filters) {
      let value = filters[field];
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
        let operator = value[2];
        let comparisonValue = value[3];
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

  run(query, params) {
    // run query
    return this.sql(query, params);
  }

  sql(query, params) {
    // run sql
    return this.knex.raw(query, params);
  }

  async commit() {
    try {
      await this.sql('commit');
    } catch (e) {
      if (e.type !== frappe.errors.CannotCommitError) {
        throw e;
      }
    }
  }

  clearValueCache(doctype, name) {
    let cacheKey = `${doctype}:${name}`;
    this.cache.hclear(cacheKey);
  }

  getColumnType(field) {
    return this.typeMap[field.fieldtype];
  }

  getError(err) {
    return frappe.errors.DatabaseError;
  }

  initTypeMap() {
    this.typeMap = {};
  }

  executePostDbConnect() {
    frappe.initializeMoneyMaker();
  }
};
