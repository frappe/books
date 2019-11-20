const frappe = require('frappejs');
const sqlite3 = require('sqlite3').verbose();
const Database = require('./database');
const errors = require('frappejs/common/errors');
const debug = false;

class SqliteDatabase extends Database {
  constructor({ dbPath }) {
    super();
    this.dbPath = dbPath;
  }

  connect(dbPath) {
    if (dbPath) {
      this.dbPath = dbPath;
    }
    return new Promise((resolve, reject) => {
      this.conn = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        if (debug) {
          this.conn.on('trace', (trace) => console.log(trace));
        }
        this.run('PRAGMA foreign_keys=ON').then(resolve);
      });
    });
  }

  async tableExists(table) {
    const name = await this.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
    return (name && name.length) ? true : false;
  }

  async addForeignKeys(doctype, newForeignKeys) {
    await this.run('PRAGMA foreign_keys=OFF');
    await this.run('BEGIN TRANSACTION');

    const tempName = 'TEMP' + doctype

    // create temp table
    await this.createTable(doctype, tempName);

    const columns = (await this.getTableColumns(tempName)).join(', ');

    // copy from old to new table
    await this.run(`INSERT INTO ${tempName} (${columns}) SELECT ${columns} from ${doctype}`);

    // drop old table
    await this.run(`DROP TABLE ${doctype}`);

    // rename new table
    await this.run(`ALTER TABLE ${tempName} RENAME TO ${doctype}`);

    await this.run('COMMIT');
    await this.run('PRAGMA foreign_keys=ON');
  }

  removeColumns() {
    // pass
  }

  async runCreateTableQuery(doctype, columns, indexes) {
    const query = `CREATE TABLE IF NOT EXISTS ${doctype} (
            ${columns.join(", ")} ${indexes.length ? (", " + indexes.join(", ")) : ''})`;

    return await this.run(query);
  }

  updateColumnDefinition(field, columns, indexes) {
    let def = this.getColumnDefinition(field);

    columns.push(def);

    if (field.fieldtype === 'Link' && field.target) {
      let meta = frappe.getMeta(field.target);
      indexes.push(`FOREIGN KEY (${field.fieldname}) REFERENCES ${meta.getBaseDocType()} ON UPDATE CASCADE ON DELETE RESTRICT`);
    }
  }

  getColumnDefinition(field) {
    let defaultValue = field.default;
    if (typeof defaultValue === 'string') {
      defaultValue = `'${defaultValue}'`
    }
    let def = [
      field.fieldname,
      this.typeMap[field.fieldtype],
      field.fieldname === 'name' ? 'PRIMARY KEY NOT NULL' : '',
      field.required ? 'NOT NULL' : '',
      field.default ? `DEFAULT ${defaultValue}` : ''
    ].join(' ');

    return def;
  }

  async getTableColumns(doctype) {
    return (await this.sql(`PRAGMA table_info(${doctype})`)).map(d => d.name);
  }

  async getForeignKeys(doctype) {
    return (await this.sql(`PRAGMA foreign_key_list(${doctype})`)).map(d => d.from);
  }

  async runAddColumnQuery(doctype, field, values) {
    await this.run(`ALTER TABLE ${doctype} ADD COLUMN ${this.getColumnDefinition(field)}`, values);
  }

  getOne(doctype, name, fields = '*') {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
    fields = this.prepareFields(fields);
    return new Promise((resolve, reject) => {
      this.conn.get(`select ${fields} from ${baseDoctype}
                where name = ?`, name,
        (err, row) => {
          resolve(row || {});
        });
    });
  }

  async insertOne(doctype, doc) {
    let fields = this.getKeys(doctype);
    let placeholders = fields.map(d => '?').join(', ');

    if (!doc.name) {
      doc.name = frappe.getRandomString();
    }

    return await this.run(`insert into ${doctype}
            (${fields.map(field => field.fieldname).join(", ")})
            values (${placeholders})`, this.getFormattedValues(fields, doc));
  }

  async updateOne(doctype, doc) {
    let fields = this.getKeys(doctype);
    let assigns = fields.map(field => `${field.fieldname} = ?`);
    let values = this.getFormattedValues(fields, doc);

    // additional name for where clause
    values.push(doc.name);

    return await this.run(`update ${doctype}
                set ${assigns.join(", ")} where name=?`, values);
  }

  async runDeleteOtherChildren(field, added) {
    // delete other children
    // `delete from doctype where parent = ? and name not in (?, ?, ?)}`
    await this.run(`delete from ${field.childtype}
            where
                parent = ? and
                name not in (${added.slice(1).map(d => '?').join(', ')})`, added);
  }

  async deleteOne(doctype, name) {
    return await this.run(`delete from ${doctype} where name=?`, name);
  }

  async deleteChildren(parenttype, parent) {
    await this.run(`delete from ${parenttype} where parent=?`, parent);
  }

  async deleteSingleValues(name) {
    await frappe.db.run('delete from SingleValue where parent=?', name)
  }

  async rename(doctype, oldName, newName) {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
    await frappe.db.run(`update ${baseDoctype} set name = ? where name = ?`, [newName, oldName]);
    await frappe.db.commit();
  }

  async setValues(doctype, name, fieldValuePair) {
    const meta = frappe.getMeta(doctype);
    const baseDoctype = meta.getBaseDocType();
    const validFields = this.getKeys(doctype);
    const validFieldnames = validFields.map(df => df.fieldname);
    const fieldsToUpdate = Object.keys(fieldValuePair)
      .filter(fieldname => validFieldnames.includes(fieldname))

    // assignment part of query
    const assigns = fieldsToUpdate.map(fieldname => `${fieldname} = ?`);

    // values
    const values = fieldsToUpdate.map(fieldname => {
      const field = meta.getField(fieldname);
      const value = fieldValuePair[fieldname];
      return this.getFormattedValue(field, value);
    });

    // additional name for where clause
    values.push(name);

    return await this.run(`update ${baseDoctype}
      set ${assigns.join(', ')} where name=?`, values);
  }

  getAll({ doctype, fields, filters, start, limit, orderBy = 'modified', groupBy, order = 'desc' } = {}) {
    let meta = frappe.getMeta(doctype);
    let baseDoctype = meta.getBaseDocType();
    if (!fields) {
      fields = meta.getKeywordFields();
    }
    if (typeof fields === 'string') {
      fields = [fields];
    }
    if (meta.filters) {
      filters = Object.assign({}, filters, meta.filters);
    }

    return new Promise((resolve, reject) => {
      let conditions = this.getFilterConditions(filters);
      let query = `select ${fields.join(", ")}
                from ${baseDoctype}
                ${conditions.conditions ? "where" : ""} ${conditions.conditions}
                ${groupBy ? ("group by " + groupBy.join(', ')) : ""}
                ${orderBy ? ("order by " + orderBy) : ""} ${orderBy ? (order || "asc") : ""}
                ${limit ? ("limit " + limit) : ""} ${start ? ("offset " + start) : ""}`;

      this.conn.all(query, conditions.values,
        (err, rows) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });
  }

  run(query, params) {
    return new Promise((resolve, reject) => {
      this.conn.run(query, params, (err) => {
        if (err) {
          console.error('Error in sql:', query);
          let Error = this.getError(err);
          reject(new Error());
        } else {
          resolve();
        }
      });
    });
  }

  sql(query, params) {
    return new Promise((resolve, reject) => {
      this.conn.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error in sql:', query);
          reject(err)
        }
        resolve(rows);
      });
    });
  }

  async commit() {
    try {
      await this.run('commit');
    } catch (e) {
      if (e.name !== 'CannotCommitError') {
        throw e;
      }
    }
  }

  initTypeMap() {
    this.typeMap = {
      'AutoComplete': 'text'
      , 'Currency': 'real'
      , 'Int': 'integer'
      , 'Float': 'real'
      , 'Percent': 'real'
      , 'Check': 'integer'
      , 'Small Text': 'text'
      , 'Long Text': 'text'
      , 'Code': 'text'
      , 'Text Editor': 'text'
      , 'Date': 'text'
      , 'Datetime': 'text'
      , 'Time': 'text'
      , 'Text': 'text'
      , 'Data': 'text'
      , 'Link': 'text'
      , 'DynamicLink': 'text'
      , 'Password': 'text'
      , 'Select': 'text'
      , 'Read Only': 'text'
      , 'File': 'text'
      , 'Attach': 'text'
      , 'AttachImage': 'text'
      , 'Signature': 'text'
      , 'Color': 'text'
      , 'Barcode': 'text'
      , 'Geolocation': 'text'
    }
  }

  getError(err) {
    if (err.message.includes('FOREIGN KEY')) {
      return frappe.errors.LinkValidationError;
    }
    if (err.message.includes('SQLITE_ERROR: cannot commit')) {
      return SqliteDatabase.CannotCommitError;
    }
    return {
      19: frappe.errors.DuplicateEntryError
    }[err.errno] || Error;
  }
}

SqliteDatabase.CannotCommitError = class CannotCommitError extends errors.DatabaseError {
  constructor(message) {
    super(message);
    this.name = 'CannotCommitError';
  }
}

module.exports = SqliteDatabase;
