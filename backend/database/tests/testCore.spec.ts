import * as assert from 'assert';
import 'mocha';
import { FieldTypeEnum, RawValue } from 'schemas/types';
import { getMapFromList, getValueMapFromList, sleep } from 'utils';
import { getDefaultMetaFieldValueMap, sqliteTypeMap } from '../../helpers';
import DatabaseCore from '../core';
import { FieldValueMap, SqliteTableInfo } from '../types';
import {
  assertDoesNotThrow,
  assertThrows,
  BaseMetaKey,
  getBuiltTestSchemaMap,
} from './helpers';

/**
 * Note: these tests have a strange structure where multiple tests are
 * inside a `specify`, this is cause `describe` doesn't support `async` or waiting
 * on promises.
 *
 * Due to this `async` db operations need to be handled in `specify`. And `specify`
 * can't be nested in the `describe` can, hence the strange structure.
 *
 * This also implies that assert calls should have discriptive
 */

describe('DatabaseCore: Connect Migrate Close', function () {
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
            `${schemaName}.${column.name}:: iotnull iheck: ${column.notnull}, ${field.required}`
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
    assert.strictEqual(rows.length, 2, 'rows length insert');
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
    assert.strictEqual(rows.length, 2, 'rows length update');
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

  specify('CRUD nondependent schema', async function () {
    const schemaName = 'Customer';
    let rows = await db.knex!(schemaName);
    assert.strictEqual(rows.length, 0, 'rows length before insertion');

    /**
     * Insert
     */
    const metaValues = getDefaultMetaFieldValueMap();
    const name = 'John Thoe';

    await assertThrows(
      async () => await db.insert(schemaName, { name }),
      'insert() did not throw without meta values'
    );

    const updateMap = Object.assign({}, metaValues, { name });
    await db.insert(schemaName, updateMap);
    rows = await db.knex!(schemaName);
    let firstRow = rows?.[0];
    assert.strictEqual(rows.length, 1, `rows length insert ${rows.length}`);
    assert.strictEqual(
      firstRow.name,
      name,
      `name check ${firstRow.name}, ${name}`
    );
    assert.strictEqual(firstRow.email, null, `email check ${firstRow.email}`);

    for (const key in metaValues) {
      assert.strictEqual(
        firstRow[key],
        metaValues[key as BaseMetaKey],
        `${key} check`
      );
    }

    /**
     * Update
     */
    const email = 'john@thoe.com';
    await sleep(1); // required for modified to change
    await db.update(schemaName, {
      name,
      email,
      modified: new Date().toISOString(),
    });
    rows = await db.knex!(schemaName);
    firstRow = rows?.[0];
    assert.strictEqual(rows.length, 1, `rows length update ${rows.length}`);
    assert.strictEqual(
      firstRow.name,
      name,
      `name check update ${firstRow.name}, ${name}`
    );
    assert.strictEqual(
      firstRow.email,
      email,
      `email check update ${firstRow.email}`
    );

    for (const key in metaValues) {
      const val = firstRow[key];
      const expected = metaValues[key as BaseMetaKey];
      if (key !== 'modified') {
        assert.strictEqual(val, expected, `${key} check ${val}, ${expected}`);
      } else {
        assert.notStrictEqual(
          val,
          expected,
          `${key} check ${val}, ${expected}`
        );
      }
    }

    /**
     * Delete
     */
    await db.delete(schemaName, name);
    rows = await db.knex!(schemaName);
    assert.strictEqual(rows.length, 0, `rows length delete ${rows.length}`);

    /**
     * Get
     */
    let fvMap = await db.get(schemaName, name);
    assert.strictEqual(
      Object.keys(fvMap).length,
      0,
      `key count get ${JSON.stringify(fvMap)}`
    );

    /**
     * > 1 entries
     */

    const cOne = { name: 'John Whoe', ...getDefaultMetaFieldValueMap() };
    const cTwo = { name: 'Jane Whoe', ...getDefaultMetaFieldValueMap() };

    // Insert
    await db.insert(schemaName, cOne);
    assert.strictEqual(
      (await db.knex!(schemaName)).length,
      1,
      `rows length minsert`
    );
    await db.insert(schemaName, cTwo);
    rows = await db.knex!(schemaName);
    assert.strictEqual(rows.length, 2, `rows length minsert`);

    const cs = [cOne, cTwo];
    for (const i in cs) {
      for (const k in cs[i]) {
        const val = cs[i][k as BaseMetaKey];
        assert.strictEqual(
          rows?.[i]?.[k],
          val,
          `equality check ${i} ${k} ${val} ${rows?.[i]?.[k]}`
        );
      }
    }

    // Update
    await db.update(schemaName, { name: cOne.name, email });
    const cOneEmail = await db.get(schemaName, cOne.name, 'email');
    assert.strictEqual(
      cOneEmail.email,
      email,
      `mi update check one ${cOneEmail}`
    );
    const cTwoEmail = await db.get(schemaName, cTwo.name, 'email');
    assert.strictEqual(
      cOneEmail.email,
      email,
      `mi update check two ${cTwoEmail}`
    );

    // Rename
    const newName = 'Johnny Whoe';
    await db.rename(schemaName, cOne.name, newName);

    fvMap = await db.get(schemaName, cOne.name);
    assert.strictEqual(
      Object.keys(fvMap).length,
      0,
      `mi rename check old ${JSON.stringify(fvMap)}`
    );

    fvMap = await db.get(schemaName, newName);
    assert.strictEqual(
      fvMap.email,
      email,
      `mi rename check new ${JSON.stringify(fvMap)}`
    );

    // Delete
    await db.delete(schemaName, newName);
    rows = await db.knex!(schemaName);
    assert.strictEqual(rows.length, 1, `mi delete length ${rows.length}`);
    assert.strictEqual(
      rows[0].name,
      cTwo.name,
      `mi delete name ${rows[0].name}`
    );
  });

  specify('CRUD dependent schema', async function () {
    const Customer = 'Customer';
    const SalesInvoice = 'SalesInvoice';
    const SalesInvoiceItem = 'SalesInvoiceItem';

    const customer: FieldValueMap = {
      name: 'John Whoe',
      email: 'john@whoe.com',
      ...getDefaultMetaFieldValueMap(),
    };

    const invoice: FieldValueMap = {
      name: 'SINV-1001',
      date: '2022-01-21',
      customer: customer.name,
      account: 'Debtors',
      submitted: false,
      cancelled: false,
      ...getDefaultMetaFieldValueMap(),
    };

    await assertThrows(
      async () => await db.insert(SalesInvoice, invoice),
      'foreign key constraint fail failed'
    );

    await assertDoesNotThrow(async () => {
      await db.insert(Customer, customer);
      await db.insert(SalesInvoice, invoice);
    }, 'insertion failed');

    await assertThrows(
      async () => await db.delete(Customer, customer.name as string),
      'foreign key constraint fail failed'
    );

    await assertDoesNotThrow(async () => {
      await db.delete(SalesInvoice, invoice.name as string);
      await db.delete(Customer, customer.name as string);
    }, 'deletion failed');

    await db.insert(Customer, customer);
    await db.insert(SalesInvoice, invoice);

    let fvMap = await db.get(SalesInvoice, invoice.name as string);
    for (const key in invoice) {
      let expected = invoice[key];
      if (typeof expected === 'boolean') {
        expected = +expected;
      }

      assert.strictEqual(
        fvMap[key],
        expected,
        `equality check ${key}: ${fvMap[key]}, ${invoice[key]}`
      );
    }

    assert.strictEqual(
      (fvMap.items as unknown[])?.length,
      0,
      'empty items check'
    );

    const items: FieldValueMap[] = [
      {
        item: 'Bottle Caps',
        quantity: 2,
        rate: 100,
        amount: 200,
      },
    ];

    await assertThrows(
      async () => await db.insert(SalesInvoice, { name: invoice.name, items }),
      'invoice insertion with ct did not fail'
    );
    await assertDoesNotThrow(
      async () => await db.update(SalesInvoice, { name: invoice.name, items }),
      'ct insertion failed'
    );

    fvMap = await db.get(SalesInvoice, invoice.name as string);
    const ct = fvMap.items as FieldValueMap[];
    assert.strictEqual(ct.length, 1, `ct length ${ct.length}`);
    assert.strictEqual(ct[0].parent, invoice.name, `ct parent ${ct[0].parent}`);
    assert.strictEqual(
      ct[0].parentFieldname,
      'items',
      `ct parentFieldname ${ct[0].parentFieldname}`
    );
    assert.strictEqual(
      ct[0].parentSchemaName,
      SalesInvoice,
      `ct parentSchemaName ${ct[0].parentSchemaName}`
    );
    for (const key in items[0]) {
      assert.strictEqual(
        ct[0][key],
        items[0][key],
        `ct values ${key}: ${ct[0][key]}, ${items[0][key]}`
      );
    }

    items.push({
      item: 'Mentats',
      quantity: 4,
      rate: 200,
      amount: 800,
    });
    await assertDoesNotThrow(
      async () => await db.update(SalesInvoice, { name: invoice.name, items }),
      'ct updation failed'
    );

    let rows = await db.getAll(SalesInvoiceItem, {
      fields: ['item', 'quantity', 'rate', 'amount'],
    });
    assert.strictEqual(rows.length, 2, `ct length update ${rows.length}`);

    for (const i in rows) {
      for (const key in rows[i]) {
        assert.strictEqual(
          rows[i][key],
          items[i][key],
          `ct values ${i},${key}: ${rows[i][key]}`
        );
      }
    }

    await db.delete(SalesInvoice, invoice.name as string);
    rows = await db.getAll(SalesInvoiceItem);
    assert.strictEqual(rows.length, 0, `ct length delete ${rows.length}`);
  });
});
