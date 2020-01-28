const assert = require('assert');
const frappe = require('frappejs');
const server = require('frappejs/server');
const SQLite = require('frappejs/backends/sqlite');

let Person = {
  name: 'Person',
  fields: [
    {
      label: 'Full Name',
      fieldname: 'name',
      fieldtype: 'Data'
    },
    {
      label: 'Age',
      fieldname: 'age',
      fieldtype: 'Int'
    },
    {
      label: 'Gender',
      fieldname: 'gender',
      fieldtype: 'Link',
      target: 'Gender'
    }
  ]
};

let Gender = {
  name: 'Gender',
  fields: [
    {
      label: 'Name',
      fieldname: 'name',
      fieldtype: 'Data'
    }
  ]
};

describe('Database Migrate', () => {
  it('should create tables for model definition', async () => {
    let dbPath = '_migrate_test.db';
    server.init();
    let models = {
      Person,
      Gender
    };
    frappe.models = {};
    frappe.registerModels(models);
    frappe.db = new SQLite({ dbPath });
    await frappe.db.connect();
    await frappe.db.migrate();

    let tables = await frappe.db
      .knex('sqlite_master')
      .select('name')
      .where('type', 'table')
      .orderBy('name')
      .pluck('name');

    // check if tables were created
    assert.deepEqual(['Gender', 'Person'], tables);

    let fields = await frappe.db.sql('PRAGMA table_info(??)', 'Person');
    // check if standard fields and model fields were created
    assert.equal(fields.length, 8);
    assert.equal(fields.find(d => d.name === 'age').type, 'integer');

    let foreignKeys = await frappe.db.sql(
      'PRAGMA foreign_key_list(??)',
      'Person'
    );
    // check for foreign keys
    assert.equal(foreignKeys.length, 1);
    assert.equal(foreignKeys[0].from, 'gender');
    assert.equal(foreignKeys[0].table, 'Gender');
  });
});
