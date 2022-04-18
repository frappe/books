import * as assert from 'assert';
import 'mocha';
import { Frappe } from '..';
import { DatabaseManager } from '../../backend/database/manager';

describe('Frappe', function () {
  const frappe = new Frappe(DatabaseManager);

  specify('Init', async function () {
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length,
      0,
      'zero schemas one'
    );
    await frappe.initializeAndRegister();
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length,
      0,
      'zero schemas two'
    );

    await frappe.db.createNewDatabase(':memory:', 'in');
    await frappe.initializeAndRegister({}, {}, true);
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length > 0,
      true,
      'non zero schemas'
    );
    await frappe.db.close();
  });
});
