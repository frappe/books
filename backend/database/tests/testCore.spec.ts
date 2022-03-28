import * as assert from 'assert';
import 'mocha';
import { getMapFromList } from 'schemas/helpers';
import { FieldTypeEnum } from 'schemas/types';
import { sqliteTypeMap } from '../../common';
import DatabaseCore from '../core';
import { SqliteTableInfo } from '../types';
import { getBuiltTestSchemaMap } from './helpers';

describe('DatabaseCore: Connect Migrate Close', async function () {
  const db = new DatabaseCore();
  specify('dbPath', function () {
    assert.strictEqual(db.dbPath, ':memory:');
  });

  const schemaMap = getBuiltTestSchemaMap();
  db.setSchemaMap(schemaMap);
  specify('schemaMap', function () {
    assert.strictEqual(schemaMap, db.schemaMap);
  });

  specify('connect', function () {
    assert.doesNotThrow(() => db.connect());
    assert.notStrictEqual(db.knex, undefined);
  });

  specify('migrate and close', async function () {
    // Does not throw
    await db.migrate();
    // Does not throw
    await db.close();
  });
});

describe('DatabaseCore: Migrate and Check Db', function () {
  let db: DatabaseCore;
  const schemaMap = getBuiltTestSchemaMap();

  this.beforeEach(async function () {
    db = new DatabaseCore();
    db.connect();
    db.setSchemaMap(schemaMap);
  });

  this.afterEach(async function () {
    await db.close();
  });

  specify(`Pre Migrate TableInfo`, async function () {
    for (const schemaName in schemaMap) {
      const columns = await db.knex?.raw('pragma table_info(??)', schemaName);
      assert.strictEqual(columns.length, 0, `column count ${schemaName}`);
    }
  });

  specify('Post Migrate TableInfo', async function () {
    await db.migrate();
    for (const schemaName in schemaMap) {
      const schema = schemaMap[schemaName];
      const fieldMap = getMapFromList(schema.fields, 'fieldname');
      const columns: SqliteTableInfo[] = await db.knex!.raw(
        'pragma table_info(??)',
        schemaName
      );

      let columnCount = schema.fields.filter(
        (f) => f.fieldtype !== FieldTypeEnum.Table
      ).length;

      if (schema.isSingle) {
        columnCount = 0;
      }

      assert.strictEqual(
        columns.length,
        columnCount,
        `${schemaName}:: column count: ${columns.length}, ${columnCount}`
      );

      for (const column of columns) {
        const field = fieldMap[column.name];
        const dbColType = sqliteTypeMap[field.fieldtype];

        assert.strictEqual(
          column.name,
          field.fieldname,
          `${schemaName}.${column.name}:: name check: ${column.name}, ${field.fieldname}`
        );

        assert.strictEqual(
          column.type,
          dbColType,
          `${schemaName}.${column.name}:: type check: ${column.type}, ${dbColType}`
        );

        if (field.required !== undefined) {
          assert.strictEqual(
            !!column.notnull,
            field.required,
            `${schemaName}.${column.name}:: notnull check: ${column.notnull}, ${field.required}`
          );
        } else {
          assert.strictEqual(
            column.notnull,
            0,
            `${schemaName}.${column.name}:: notnull check: ${column.notnull}, ${field.required}`
          );
        }

        if (column.dflt_value === null) {
          assert.strictEqual(
            field.default,
            undefined,
            `${schemaName}.${column.name}:: dflt_value check: ${column.dflt_value}, ${field.default}`
          );
        } else {
          assert.strictEqual(
            column.dflt_value.slice(1, -1),
            String(field.default),
            `${schemaName}.${column.name}:: dflt_value check: ${column.type}, ${dbColType}`
          );
        }
      }
    }
  });
});
