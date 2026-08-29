import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { assertThrows } from 'backend/database/tests/helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

/**
 * Several schemas (JournalEntry, Payment, SalesInvoice, PurchaseInvoice, etc.)
 * display a computed "status" column in their list views, but do NOT have a
 * real "status" field in the database.  The FilterDropdown UI exposes this
 * synthetic field as filterable, which means a user can select e.g.
 * "status Does Not Contain Cancelled".  If the operator is anything other than
 * "like", the List.vue component passes it through to the DB query, causing:
 *
 *   SqliteError: no such column: status
 *
 * Issue #1446 reports this for JournalEntry, but it affects every schema with
 * a computed status column.
 */

const schemasWithComputedStatus = [
  ModelNameEnum.JournalEntry,
  ModelNameEnum.Payment,
  ModelNameEnum.SalesInvoice,
  ModelNameEnum.PurchaseInvoice,
];

test('schemas with computed status must not have a real status field', (t) => {
  for (const schemaName of schemasWithComputedStatus) {
    const fieldMap = fyo.db.fieldMap[schemaName];
    t.ok(fieldMap, `fieldMap exists for ${schemaName}`);
    t.notOk(
      fieldMap?.['status'],
      `${schemaName} has no real "status" DB column (it is computed)`
    );
  }
  t.end();
});

test('querying a computed-status schema with status filter throws', async (t) => {
  /**
   * This test proves the bug exists at the database level: any schema
   * whose status is computed (not stored) will crash if the query
   * includes a status filter.
   *
   * The fix belongs in List.vue (strip status from DB queries when
   * the schema has no real status column), but this test documents
   * the invariant that the DB layer does NOT silently ignore unknown
   * columns — it rightfully throws.
   */
  for (const schemaName of schemasWithComputedStatus) {
    let threw = false;
    try {
      await fyo.db.getAll(schemaName, {
        filters: { status: ['not like', 'Cancelled'] },
      });
    } catch (err) {
      threw = true;
      t.ok(
        (err as Error).message.includes('no such column: status'),
        `${schemaName}: throws "no such column: status"`
      );
    }
    t.ok(threw, `${schemaName}: status filter throws on DB query`);
  }
});

closeTestFyo(fyo, __filename);
