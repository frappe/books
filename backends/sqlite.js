const frappe = require('frappejs');
const Database = require('./database');

class SqliteDatabase extends Database {
  constructor({ dbPath }) {
    super();
    this.dbPath = dbPath;
    this.connectionParams = {
      client: 'sqlite3',
      connection: {
        filename: this.dbPath
      },
      pool: {
        afterCreate(conn, done) {
          conn.run('PRAGMA foreign_keys=ON');
          done();
        }
      },
      useNullAsDefault: true,
      asyncStackTraces: process.env.NODE_ENV === 'development'
    };
  }

  async addForeignKeys(doctype, newForeignKeys) {
    await this.sql('PRAGMA foreign_keys=OFF');
    await this.sql('BEGIN TRANSACTION');

    const tempName = 'TEMP' + doctype;

    // create temp table
    await this.createTable(doctype, tempName);

    // copy from old to new table
    await this.knex(tempName).insert(this.knex.select().from(doctype));

    // drop old table
    await this.knex.schema.dropTable(doctype);

    // rename new table
    await this.knex.schema.renameTable(tempName, doctype);

    await this.sql('COMMIT');
    await this.sql('PRAGMA foreign_keys=ON');
  }

  removeColumns() {
    // pass
  }

  async getTableColumns(doctype) {
    return (await this.sql(`PRAGMA table_info(${doctype})`)).map(d => d.name);
  }

  async getForeignKeys(doctype) {
    return (await this.sql(`PRAGMA foreign_key_list(${doctype})`)).map(
      d => d.from
    );
  }

  initTypeMap() {
    // prettier-ignore
    this.typeMap = {
      'AutoComplete': 'text',
      'Currency': 'float',
      'Int': 'integer',
      'Float': 'float',
      'Percent': 'float',
      'Check': 'integer',
      'Small Text': 'text',
      'Long Text': 'text',
      'Code': 'text',
      'Text Editor': 'text',
      'Date': 'text',
      'Datetime': 'text',
      'Time': 'text',
      'Text': 'text',
      'Data': 'text',
      'Link': 'text',
      'DynamicLink': 'text',
      'Password': 'text',
      'Select': 'text',
      'Read Only': 'text',
      'File': 'text',
      'Attach': 'text',
      'AttachImage': 'text',
      'Signature': 'text',
      'Color': 'text',
      'Barcode': 'text',
      'Geolocation': 'text'
    };
  }

  getError(err) {
    let errorType = frappe.errors.DatabaseError;
    if (err.message.includes('FOREIGN KEY')) {
      errorType = frappe.errors.LinkValidationError;
    }
    if (err.message.includes('SQLITE_ERROR: cannot commit')) {
      errorType = frappe.errors.CannotCommitError;
    }
    if (err.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed:')) {
      errorType = frappe.errors.DuplicateEntryError;
    }
    return errorType;
  }
}

module.exports = SqliteDatabase;
