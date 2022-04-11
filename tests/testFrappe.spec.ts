import * as assert from 'assert';
import 'mocha';
import { DatabaseManager } from '../backend/database/manager';
import { Frappe } from '../frappe';

describe('Frappe', function () {
  const frappe = new Frappe(DatabaseManager);

  specify('Init', async function () {
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length,
      0,
      'zero schemas one'
    );
    await frappe.init();
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length,
      0,
      'zero schemas two'
    );

    await frappe.db.createNewDatabase(':memory:');
    await frappe.initializeAndRegister({}, true);
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length > 0,
      true,
      'non zero schemas'
    );
    await frappe.db.close();
  });
});
