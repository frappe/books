import * as assert from 'assert';
import 'mocha';
import { getMapFromList } from 'schemas/helpers';
import { FieldTypeEnum, RawValue } from 'schemas/types';
import { getValueMapFromList } from 'utils';
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

describe('DatabaseCore: CRUD', function () {
  let db: DatabaseCore;
  const schemaMap = getBuiltTestSchemaMap();

  this.beforeEach(async function () {
    db = new DatabaseCore();
    db.connect();
    db.setSchemaMap(schemaMap);
    await db.migrate();
  });

  this.afterEach(async function () {
    await db.close();
  });

  specify('exists() before insertion', async function () {
    for (const schemaName in schemaMap) {
      const doesExist = await db.exists(schemaName);
      if (['SingleValue', 'SystemSettings'].includes(schemaName)) {
        assert.strictEqual(doesExist, true, `${schemaName} exists`);
      } else {
        assert.strictEqual(doesExist, false, `${schemaName} exists`);
      }
    }
  });

  specify('CRUD single values', async function () {
    /**
     * Checking default values which are created when db.migrate
     * takes place.
     */
    let rows: Record<string, RawValue>[] = await db.knex!.raw(
      'select * from SingleValue'
    );
    const defaultMap = getValueMapFromList(
      schemaMap.SystemSettings.fields,
      'fieldname',
      'default'
    );
    for (const row of rows) {
      assert.strictEqual(
        row.value,
        defaultMap[row.fieldname as string],
        `${row.fieldname} default values equality`
      );
    }

    /**
     * Insertion and updation for single values call the same function.
     *
     * Insert
     */

    let localeRow = rows.find((r) => r.fieldname === 'locale');
    const localeEntryName = localeRow?.name as string;
    const localeEntryCreated = localeRow?.created as string;

    let locale = 'hi-IN';
    await db.insert('SystemSettings', { locale });
    rows = await db.knex!.raw('select * from SingleValue');
    localeRow = rows.find((r) => r.fieldname === 'locale');

    assert.notStrictEqual(localeEntryName, undefined, 'localeEntryName');
    assert.strictEqual(rows.length, 2, 'row length');
    assert.strictEqual(
      localeRow?.name as string,
      localeEntryName,
      `localeEntryName ${localeRow?.name}, ${localeEntryName}`
    );
    assert.strictEqual(
      localeRow?.value,
      locale,
      `locale ${localeRow?.value}, ${locale}`
    );
    assert.strictEqual(
      localeRow?.created,
      localeEntryCreated,
      `locale ${localeRow?.value}, ${locale}`
    );

    /**
     * Update
     */
    locale = 'ca-ES';
    await db.update('SystemSettings', { locale });
    rows = await db.knex!.raw('select * from SingleValue');
    localeRow = rows.find((r) => r.fieldname === 'locale');

    assert.notStrictEqual(localeEntryName, undefined, 'localeEntryName');
    assert.strictEqual(rows.length, 2, 'row length');
    assert.strictEqual(
      localeRow?.name as string,
      localeEntryName,
      `localeEntryName ${localeRow?.name}, ${localeEntryName}`
    );
    assert.strictEqual(
      localeRow?.value,
      locale,
      `locale ${localeRow?.value}, ${locale}`
    );
    assert.strictEqual(
      localeRow?.created,
      localeEntryCreated,
      `locale ${localeRow?.value}, ${locale}`
    );

    /**
     * Delete
     */
    await db.delete('SystemSettings', 'locale');
    rows = await db.knex!.raw('select * from SingleValue');
    assert.strictEqual(rows.length, 1, 'delete one');
    await db.delete('SystemSettings', 'dateFormat');
    rows = await db.knex!.raw('select * from SingleValue');
    assert.strictEqual(rows.length, 0, 'delete two');

    const dateFormat = 'dd/mm/yy';
    await db.insert('SystemSettings', { locale, dateFormat });
    rows = await db.knex!.raw('select * from SingleValue');
    assert.strictEqual(rows.length, 2, 'delete two');

    /**
     * Read
     *
     * getSingleValues
     */
    const svl = await db.getSingleValues('locale', 'dateFormat');
    assert.strictEqual(svl.length, 2, 'getSingleValues length');
    for (const sv of svl) {
      assert.strictEqual(
        sv.parent,
        'SystemSettings',
        `singleValue parent ${sv.parent}`
      );
      assert.strictEqual(
        sv.value,
        { locale, dateFormat }[sv.fieldname],
        `singleValue value ${sv.value}`
      );

      /**
       * get
       */
      const svlMap = await db.get('SystemSettings');
      assert.strictEqual(Object.keys(svlMap).length, 2, 'get key length');
      assert.strictEqual(svlMap.locale, locale, 'get locale');
      assert.strictEqual(svlMap.dateFormat, dateFormat, 'get locale');
    }
  });

  specify('CRUD simple nondependent schema', async function () {});
});
